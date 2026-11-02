import logger from "../shared/utils/logger.js";
import { AppError } from "../shared/errors/index.js";

/**
 * Express error handler. Distinguishes AppError (expected) from unknown
 * errors (unexpected, logged with full stack).
 */
export function errorHandler(err, req, res, _next) {
  if (err?.type === "entity.too.large" || err?.status === 413) {
    return res.status(413).json({
      error: "Request body exceeds the allowed size",
      code: "PAYLOAD_TOO_LARGE",
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error("AppError", {
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
        path: req.path,
      });
    }
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Zod-style errors if they ever reach here.
  if (err?.issues) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    return res
      .status(400)
      .json({ error: "Validation failed", code: "VALIDATION_ERROR", details });
  }

  // Firebase / Firestore errors.
  const firebaseCode = err?.code;
  if (firebaseCode) {
    const map = {
      "auth/user-not-found": [404, "User not found"],
      "auth/invalid-credential": [401, "Invalid credentials"],
      "auth/email-already-exists": [409, "Email already in use"],
      "permission-denied": [403, "Permission denied"],
      "resource-exists": [409, "Resource already exists"],
      "not-found": [404, "Resource not found"],
      "already-exists": [409, "Resource already exists"],
      "failed-precondition": [400, "Operation failed precondition"],
    };
    const [status, message] = map[firebaseCode] || [
      500,
      "Internal server error",
    ];
    logger.error("Firebase error", { code: firebaseCode, path: req.path });
    return res
      .status(status)
      .json({ error: message, code: firebaseCode.toUpperCase() });
  }

  logger.error("Unhandled error", {
    error: err?.message,
    stack: err?.stack,
    path: req.path,
  });
  return res
    .status(500)
    .json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}

export default errorHandler;
