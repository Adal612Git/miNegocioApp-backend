import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import mongoose from "mongoose";
import crypto from "crypto";
import nodemailer from "nodemailer";

import { BusinessModel } from "./business.model";
import { UserModel } from "./user.model";
import { PasswordResetModel } from "./password-reset.model";

const registerSchema = z.object({
  business_name: z.string().min(2).max(120),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
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
      const { business_name, name, email, password } = registerSchema.parse(
        req.body
      );

      const existing = await UserModel.exists({ email });
      if (existing) {
        return res.status(409).json({ message: "EMAIL_ALREADY_EXISTS" });
      }

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
              password_hash: passwordHash,
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
        return res.status(500).json({ message: "REGISTER_FAILED" });
      }

      const token = signToken({ userId, businessId });
      return res.status(201).json({ token });
    } catch (err) {
      return next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await UserModel.findOne({ email })
        .lean<{
          _id: mongoose.Types.ObjectId;
          business_id: mongoose.Types.ObjectId;
          password_hash: string;
        }>()
        .exec();
      if (!user) {
        return res.status(401).json({ message: "INVALID_CREDENTIALS" });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "INVALID_CREDENTIALS" });
      }

      const token = signToken({
        userId: user._id.toString(),
        businessId: user.business_id.toString(),
      });

      return res.status(200).json({ token });
    } catch (err) {
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

      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM;

      if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
        return res.status(500).json({ message: "SMTP_NOT_CONFIGURED" });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: "Recuperacion de cuenta",
        text: `Usa este enlace para recuperar tu cuenta: ${resetUrl}`,
      });

      return res.status(200).json({ message: "RESET_EMAIL_SENT" });
    } catch (err) {
      return next(err);
    }
  },
};
