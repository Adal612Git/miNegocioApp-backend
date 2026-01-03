"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const zod_1 = require("zod");
function errorMiddleware(err, _req, res, _next) {
    console.error("Unhandled error:", err);
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            message: "VALIDATION_ERROR",
            errors: err.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        });
    }
    const error = err;
    if (error?.code === 11000 || error?.code === "11000") {
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
    return res.status(500).json({ message: "INTERNAL_SERVER_ERROR" });
}
