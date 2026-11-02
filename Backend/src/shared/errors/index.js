/**
 * Application error class that carries an HTTP status code and a stable
 * error code so the frontend can branch on it without parsing messages.
 */
export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const Errors = {
  unauthorized: (message = 'Unauthorized') => new AppError(message, 401, 'UNAUTHORIZED'),
  forbidden: (message = 'Forbidden') => new AppError(message, 403, 'FORBIDDEN'),
  notFound: (message = 'Not found') => new AppError(message, 404, 'NOT_FOUND'),
  conflict: (message = 'Conflict') => new AppError(message, 409, 'CONFLICT'),
  validation: (message = 'Validation failed', details = null) => new AppError(message, 400, 'VALIDATION_ERROR', details),
  rateLimited: (message = 'Too many requests') => new AppError(message, 429, 'RATE_LIMITED'),
  internal: (message = 'Internal server error') => new AppError(message, 500, 'INTERNAL_ERROR'),
};

export default { AppError, Errors };