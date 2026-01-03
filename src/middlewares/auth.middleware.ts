import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type AuthPayload = {
  userId: string;
  businessId: string;
};

function getTokenFromHeader(req: Request) {
  const header = req.headers.authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: "UNAUTHORIZED" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET_MISSING" });
    }

    const payload = jwt.verify(token, secret) as AuthPayload;
    if (!payload?.userId || !payload?.businessId) {
      return res.status(401).json({ message: "UNAUTHORIZED" });
    }

    (req as Request & { auth: AuthPayload }).auth = {
      userId: payload.userId,
      businessId: payload.businessId,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "UNAUTHORIZED" });
  }
}
