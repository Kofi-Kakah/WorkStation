import express from "express";
import helmet from "helmet";
import cors from "./config/cors.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.js";
import routes from "./routes/index.js";
import health from "./routes/health.js";
import notFoundHandler from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./shared/utils/logger.js";
import env from "./config/env.js";

/**
 * Build the Express application. Separated from server.js so tests can
 * import the app without starting a listener.
 */
export function createApp() {
  const app = express();

  // Security headers.
  app.use(
    helmet({
      contentSecurityPolicy: false, // frontend is a separate SPA
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // CORS.
  app.use(cors);

  // Body parsing.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  // Request id + logging.
  app.use((req, _res, next) => {
    const requestId = req.headers["x-request-id"];
    req.id =
      typeof requestId === "string" &&
      /^[A-Za-z0-9._:-]{1,128}$/.test(requestId)
        ? requestId
        : crypto.randomUUID();
    logger.http(`${req.method} ${req.path}`, { requestId: req.id });
    next();
  });

  // Rate limiting.
  app.use("/api/", apiLimiter);
  app.use(`/api/${env.apiVersion}/auth/`, authLimiter);

  // Keep the liveness endpoints unversioned while mounting application APIs.
  app.use("/api", health);
  app.use(`/api/${env.apiVersion}`, routes);

  // 404 + error handlers.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
