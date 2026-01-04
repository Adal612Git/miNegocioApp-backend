import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

type AppErrorLike = {
  name?: string;
  statusCode?: number;
  message?: string;
  code?: string | number;
};

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Unhandled error:", err);
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return res.status(400).json({
      message: firstIssue?.message || "Datos inválidos",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const error = err as AppErrorLike & { keyValue?: Record<string, unknown> };

  if (error?.code === 11000 || error?.code === "11000") {
    if (error?.keyValue?.email) {
      return res.status(409).json({
        message: "El correo ya existe",
        fields: error.keyValue || {},
      });
    }
    return res.status(409).json({
      message: "DUPLICATE_KEY",
      fields: error.keyValue || {},
    });
  }

  if (error?.name === "AppError" && typeof error.statusCode === "number") {
    return res.status(error.statusCode).json({
      message: error.message || "APP_ERROR",
      code: error.code,
    });
  }

  return res.status(500).json({ message: "Error interno del servidor" });
}
