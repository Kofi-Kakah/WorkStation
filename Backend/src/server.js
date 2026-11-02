import { createApp } from './app.js';
import { initializeFirebase } from './config/firebase.js';
import env from './config/env.js';
import logger from './shared/utils/logger.js';

async function main() {
  try {
    initializeFirebase();
    logger.info('Firebase initialized', { projectId: env.firebase.projectId || 'emulator/default' });
  } catch (error) {
    logger.warn('Firebase initialization failed (continuing in degraded mode)', { error: error?.message });
  }

  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`Backend listening on port ${env.port}`, { env: env.nodeEnv, apiVersion: env.apiVersion });
  });

  // Graceful shutdown.
  const shutdown = (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error('Failed to start server', { error: error?.stack || error });
  process.exit(1);
});