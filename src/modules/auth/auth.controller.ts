import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import { promises as dns } from "dns";
import { sendEmail } from "../../config/mail";

import { BusinessModel } from "./business.model";
import { UserModel } from "./user.model";
import { PasswordResetModel } from "./password-reset.model";

const blockedEmailDomains = new Set([
  "example.com",
  "example.net",
  "example.org",
  "test.com",
  "test.net",
  "test.org",
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "10minutemail.com",
  "asd.com",
]);

const emailDomainCache = new Map<string, boolean>();

async function hasValidEmailDomain(email: string) {
  const parts = String(email || "").toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1].trim();
  if (!domain || blockedEmailDomains.has(domain)) return false;
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) return false;

  if (process.env.NODE_ENV === "test" || process.env.SKIP_EMAIL_DOMAIN_CHECK === "true") {
    return true;
  }

  if (emailDomainCache.has(domain)) {
    return emailDomainCache.get(domain) === true;
  }

  try {
    const records = await dns.resolveMx(domain);
    const isValid = Array.isArray(records) && records.length > 0;
    emailDomainCache.set(domain, isValid);
    return isValid;
  } catch {
    emailDomainCache.set(domain, false);
    return false;
  }
}

const registerSchema = z.object({
  business_name: z
    .string()
    .min(2, { message: "Nombre del negocio requerido" })
    .max(120, { message: "Nombre del negocio demasiado largo" }),
  name: z
    .string()
    .min(2, { message: "Nombre demasiado corto" })
    .max(50, { message: "Nombre demasiado largo" }),
  phone: z
    .coerce
    .string()
    .min(10, { message: "El telefono debe tener al menos 10 digitos" })
    .max(15, { message: "El telefono debe tener maximo 15 digitos" }),
  email: z
    .string()
    .email({ message: "Formato de correo inválido" })
    .refine(async (value) => hasValidEmailDomain(value), {
      message: "Dominio de correo inválido",
    }),
  password: z
    .string()
    .min(8, { message: "Contraseña demasiado corta" })
    .max(128, { message: "Contraseña demasiado larga" }),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Formato de correo inválido" }),
  password: z
    .string()
    .min(8, { message: "Contraseña demasiado corta" })
    .max(128, { message: "Contraseña demasiado larga" }),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128),
});

function signToken(payload: { userId: string; businessId: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
  return jwt.sign(payload, secret, { expiresIn });
}

function isReplicaSetError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.toLowerCase().includes("replica set")
  );
}

export const AuthController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { business_name, name, phone, email, password } =
        await registerSchema.parseAsync(req.body);

      const smtpPass = process.env.SMTP_PASS;
      if (!smtpPass) {
        return res.status(500).json({ message: "Configuración de correo no disponible" });
      }

      const existing = await UserModel.exists({ email });
      if (existing) {
        return res.status(409).json({ message: "El correo ya existe" });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const userObjectId = new mongoose.Types.ObjectId();
      const businessObjectId = new mongoose.Types.ObjectId();
      const passwordHash = await bcrypt.hash(password, 12);
      let businessId: string | null = null;
      let userId: string | null = null;

      const createDocs = async (session?: mongoose.ClientSession) => {
        await BusinessModel.create(
          [
            {
              _id: businessObjectId,
              name: business_name,
              owner_user_id: userObjectId,
              created_at: new Date(),
            },
          ],
          session ? { session } : undefined
        );

        await UserModel.create(
          [
            {
              _id: userObjectId,
              business_id: businessObjectId,
              name,
              email,
              phone,
              password_hash: passwordHash,
              isVerified: false,
              verificationToken,
            },
          ],
          session ? { session } : undefined
        );

        businessId = businessObjectId.toString();
        userId = userObjectId.toString();
      };

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await createDocs(session);
        });
      } catch (err) {
        if (isReplicaSetError(err)) {
          await createDocs();
        } else {
          throw err;
        }
      } finally {
        session.endSession();
      }

      if (!businessId || !userId) {
        return res.status(500).json({ message: "No se pudo completar el registro" });
      }

      const verifyUrl = `https://app.lotosproductions.com/verify.html?token=${verificationToken}`;
      await sendEmail({
        to: email,
        subject: "Bienvenida y verificacion de cuenta",
        html: `Bienvenido a Loto App. Verifica tu cuenta aqui: <a href="${verifyUrl}">${verifyUrl}</a>`,
      });

      const token = signToken({ userId, businessId });
      return res.status(201).json({ token });
    } catch (err) {
      return next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      console.log(" Intento de login para:", email);

      const user = await UserModel.findOne({ email })
        .lean<{
          _id: mongoose.Types.ObjectId;
          business_id: mongoose.Types.ObjectId;
          password_hash: string;
          isVerified?: boolean;
        }>()
        .exec();
      if (!user) {
        console.warn("❌ Usuario NO existe");
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      console.log("✅ Usuario encontrado en BD");
      console.log("❓ ¿Está verificado?:", user.isVerified);

      if (user.isVerified === false) {
        return res
          .status(403)
          .json({ message: "Debes verificar tu correo para ingresar" });
      }

      console.log("⚖️ Comparando contraseñas...");
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        console.error(" Password incorrecto - Fallo de coincidencia");
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const token = signToken({
        userId: user._id.toString(),
        businessId: user.business_id.toString(),
      });

      return res.status(200).json({ token });
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("❌ Error de validación:", err.issues);
      }
      return next(err);
    }
  },

  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      const user = await UserModel.findOne({ email })
        .lean<{ _id: mongoose.Types.ObjectId }>()
        .exec();
      if (!user) {
        return res.status(200).json({ message: "RESET_EMAIL_SENT" });
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

      await PasswordResetModel.create({
        user_id: user._id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      const smtpPass = process.env.SMTP_PASS;

      if (!smtpPass) {
        return res.status(500).json({ message: "SMTP_NOT_CONFIGURED" });
      }

      const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
      const normalizedBase = baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl;
      const resetUrl = `${normalizedBase}/reset.html?token=${rawToken}`;

      await sendEmail({
        to: email,
        subject: "Recuperacion de cuenta",
        html: `Usa este enlace para recuperar tu cuenta: <a href="${resetUrl}">${resetUrl}</a>`,
      });

      return res.status(200).json({ message: "RESET_EMAIL_SENT" });
    } catch (err) {
      return next(err);
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const reset = await PasswordResetModel.findOneAndDelete({
        token_hash: tokenHash,
        expires_at: { $gt: new Date() },
      }).lean<{ user_id: mongoose.Types.ObjectId }>();

      if (!reset?.user_id) {
        return res.status(400).json({ message: "INVALID_TOKEN" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await UserModel.updateOne(
        { _id: reset.user_id },
        { $set: { password_hash: passwordHash } }
      );

      return res.status(200).json({ message: "PASSWORD_RESET_OK" });
    } catch (err) {
      return next(err);
    }
  },

  verify: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ message: "INVALID_TOKEN" });
      }

      const verified = await UserModel.findOneAndUpdate(
        { verificationToken: token },
        { $set: { isVerified: true }, $unset: { verificationToken: "" } },
        { new: true }
      )
        .lean<{ _id: mongoose.Types.ObjectId }>()
        .exec();

      if (!verified) {
        return res.status(400).json({ message: "INVALID_TOKEN" });
      }

      const acceptHeader = req.get("accept") || "";
      if (acceptHeader.includes("text/html")) {
        return res.redirect(302, "https://app.lotosproductions.com/index.html");
      }

      return res.status(200).json({ message: "ACCOUNT_VERIFIED" });
    } catch (err) {
      return next(err);
    }
  },

  adminResetUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const emailSchema = z.object({ email: z.string().email() });
      const { email } = emailSchema.parse(req.body);

      if (email !== "romeromedinar612@gmail.com") {
        return res.status(403).json({ message: "FORBIDDEN" });
      }

      const passwordHash = await bcrypt.hash("12345678", 12);
      const updated = await UserModel.findOneAndUpdate(
        { email },
        {
          $set: { password_hash: passwordHash, isVerified: true },
          $unset: { verificationToken: "" },
        },
        { new: true }
      )
        .lean<{ _id: mongoose.Types.ObjectId }>()
        .exec();

      if (!updated) {
        return res.status(404).json({ message: "USER_NOT_FOUND" });
      }

      console.log("Admin reset user", { email });
      return res.status(200).json({ message: "USER_RESET_OK" });
    } catch (err) {
      return next(err);
    }
  },

  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const user = await UserModel.findById(userId)
        .lean<{
          _id: mongoose.Types.ObjectId;
          business_id: mongoose.Types.ObjectId;
          name: string;
          email: string;
          phone?: string;
        }>()
        .exec();

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      return res.status(200).json({
        id: user._id.toString(),
        business_id: user.business_id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || null,
      });
    } catch (err) {
      return next(err);
    }
  },

  verifyAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await UserModel.updateMany({}, { $set: { isVerified: true } });
      return res.status(200).json({ message: "USERS_VERIFIED" });
    } catch (err) {
      return next(err);
    }
  },
};


