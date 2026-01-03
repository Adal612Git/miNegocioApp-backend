"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getTokenFromHeader(req) {
    const header = req.headers.authorization;
    if (!header)
        return null;
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token)
        return null;
    return token;
}
function authMiddleware(req, res, next) {
    try {
        const token = getTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({ message: "UNAUTHORIZED" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ message: "JWT_SECRET_MISSING" });
        }
        const payload = jsonwebtoken_1.default.verify(token, secret);
        if (!payload?.userId || !payload?.businessId) {
            return res.status(401).json({ message: "UNAUTHORIZED" });
        }
        req.auth = {
            userId: payload.userId,
            businessId: payload.businessId,
        };
        return next();
    }
    catch {
        return res.status(401).json({ message: "UNAUTHORIZED" });
    }
}
