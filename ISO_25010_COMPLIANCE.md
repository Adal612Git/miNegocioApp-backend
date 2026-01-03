# ISO/IEC 25010 Compliance Notes

This document summarizes how the current architecture and implementation support key ISO/IEC 25010 quality characteristics.

## Security
- Passwords are stored using bcrypt hashing with per-user salts.
- JWTs are signed and verified; `businessId` and `userId` come only from the token.
- Input validation with Zod rejects malformed or missing data at the controller layer.
- HTTP security headers are enabled via Helmet in the Express app.

## Reliability
- Sales use MongoDB transactions to ensure stock updates and sale creation are atomic.
- Global error middleware normalizes failures and prevents unhandled errors from leaking.
- Overlap checks for appointments avoid inconsistent scheduling states.

## Performance Efficiency
- Indexed fields on `businessId`, `createdAt`, and time ranges allow fast filtering.
- Stock updates use conditional updates (`$gte`) to avoid expensive locks and retries.

## Maintainability
- Modular structure with controllers, services, and models keeps responsibilities separated.
- TypeScript strict mode improves static safety and refactoring confidence.
- OpenAPI documentation (`swagger.yaml`) provides a single source of truth for API contracts.
