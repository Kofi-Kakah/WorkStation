/**
 * 404 handler. Must be registered AFTER all routes.
 */
export default function notFoundHandler(req, res, _next) {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
}