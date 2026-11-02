import express from 'express';
import helmet from 'helmet';
import cors from './config/cors.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import routes from './routes/index.js';
import notFoundHandler from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './shared/utils/logger.js';

/**
 * Build the Express application. Separated from server.js so tests can
 * import the app without starting a listener.
 */
export function createApp() {
  const app = express();

  // Security headers.
  app.use(helmet({
    contentSecurityPolicy: false, // frontend is a separate SPA
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS.
  app.use(cors);

  // Body parsing.
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request id + logging.
  app.use((req, _res, next) => {
    req.id = req.headers['x-request-id'] || crypto.randomUUID();
    logger.http(`${req.method} ${req.path}`, { requestId: req.id });
    next();
  });

  // Rate limiting.
  app.use('/api/', apiLimiter);
  app.use('/api/v1/auth/', authLimiter);

  // API routes.
  app.use('/api', routes);

  // 404 + error handlers.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;