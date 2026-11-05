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

  if (
    err?.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && err?.status === 400 && "body" in err)
  ) {
    return res.status(400).json({
      error: "Malformed JSON request body",
      code: "INVALID_JSON",
    });
  }

  if (err?.type === "request.aborted") {
    return res.status(400).json({
      error: "Request was aborted",
      code: "REQUEST_ABORTED",
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error("AppError", {
        code: err.code,
        statusCode: err.statusCode,
        message: err.message,
        path: req.path,
        requestId: req.id,
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
      "auth/id-token-expired": [401, "ID token has expired"],
      "auth/id-token-revoked": [401, "ID token has been revoked"],
      "auth/insufficient-permission": [403, "Permission denied"],
      "permission-denied": [403, "Permission denied"],
      "unauthenticated": [401, "Authentication required"],
      "resource-exists": [409, "Resource already exists"],
      "not-found": [404, "Resource not found"],
      "already-exists": [409, "Resource already exists"],
      "aborted": [409, "The operation conflicted with another change"],
      "failed-precondition": [400, "Operation failed precondition"],
      "invalid-argument": [400, "Invalid request"],
      "out-of-range": [400, "Request value is out of range"],
      "resource-exhausted": [429, "Too many requests, please try again later"],
      "deadline-exceeded": [503, "The request timed out, please try again"],
      "unavailable": [503, "The service is temporarily unavailable"],
      "cancelled": [503, "The request was cancelled, please try again"],
    };
    const [status, message] = map[firebaseCode] || [
      500,
      "Internal server error",
    ];
    const log = status >= 500 ? logger.error : logger.warn;
    log("Firebase error", {
      code: firebaseCode,
      status,
      path: req.path,
      requestId: req.id,
    });
    return res.status(status).json({
      error: message,
      code: firebaseCode.replaceAll("-", "_").toUpperCase(),
    });
  }

  logger.error("Unhandled error", {
    error: err?.message,
    stack: err?.stack,
    path: req.path,
    requestId: req.id,
  });
  return res
    .status(500)
    .json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}

export default errorHandler;
