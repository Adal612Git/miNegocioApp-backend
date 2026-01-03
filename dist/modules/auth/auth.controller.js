"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const business_model_1 = require("./business.model");
const user_model_1 = require("./user.model");
const password_reset_model_1 = require("./password-reset.model");
const registerSchema = zod_1.z.object({
    business_name: zod_1.z.string().min(2).max(120),
    name: zod_1.z.string().min(2).max(120),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
function signToken(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not set");
    }
    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d");
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
}
function isReplicaSetError(err) {
    const message = err instanceof Error ? err.message : String(err);
    return (message.includes("Transaction numbers are only allowed") ||
        message.toLowerCase().includes("replica set"));
}
exports.AuthController = {
    register: async (req, res, next) => {
        try {
            const { business_name, name, email, password } = registerSchema.parse(req.body);
            const existing = await user_model_1.UserModel.exists({ email });
            if (existing) {
                return res.status(409).json({ message: "EMAIL_ALREADY_EXISTS" });
            }
            const userObjectId = new mongoose_1.default.Types.ObjectId();
            const businessObjectId = new mongoose_1.default.Types.ObjectId();
            const passwordHash = await bcryptjs_1.default.hash(password, 12);
            let businessId = null;
            let userId = null;
            const createDocs = async (session) => {
                await business_model_1.BusinessModel.create([
                    {
                        _id: businessObjectId,
                        name: business_name,
                        owner_user_id: userObjectId,
                        created_at: new Date(),
                    },
                ], session ? { session } : undefined);
                await user_model_1.UserModel.create([
                    {
                        _id: userObjectId,
                        business_id: businessObjectId,
                        name,
                        email,
                        password_hash: passwordHash,
                    },
                ], session ? { session } : undefined);
                businessId = businessObjectId.toString();
                userId = userObjectId.toString();
            };
            const session = await mongoose_1.default.startSession();
            try {
                await session.withTransaction(async () => {
                    await createDocs(session);
                });
            }
            catch (err) {
                if (isReplicaSetError(err)) {
                    await createDocs();
                }
                else {
                    throw err;
                }
            }
            finally {
                session.endSession();
            }
            if (!businessId || !userId) {
                return res.status(500).json({ message: "REGISTER_FAILED" });
            }
            const token = signToken({ userId, businessId });
            return res.status(201).json({ token });
        }
        catch (err) {
            return next(err);
        }
    },
    login: async (req, res, next) => {
        try {
            const { email, password } = loginSchema.parse(req.body);
            const user = await user_model_1.UserModel.findOne({ email })
                .lean()
                .exec();
            if (!user) {
                return res.status(401).json({ message: "INVALID_CREDENTIALS" });
            }
            const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ message: "INVALID_CREDENTIALS" });
            }
            const token = signToken({
                userId: user._id.toString(),
                businessId: user.business_id.toString(),
            });
            return res.status(200).json({ token });
        }
        catch (err) {
            return next(err);
        }
    },
    forgotPassword: async (req, res, next) => {
        try {
            const { email } = forgotPasswordSchema.parse(req.body);
            const user = await user_model_1.UserModel.findOne({ email })
                .lean()
                .exec();
            if (!user) {
                return res.status(200).json({ message: "RESET_EMAIL_SENT" });
            }
            const rawToken = crypto_1.default.randomBytes(32).toString("hex");
            const tokenHash = crypto_1.default
                .createHash("sha256")
                .update(rawToken)
                .digest("hex");
            const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
            await password_reset_model_1.PasswordResetModel.create({
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
            const transporter = nodemailer_1.default.createTransport({
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
        }
        catch (err) {
            return next(err);
        }
    },
};
