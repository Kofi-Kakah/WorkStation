import cors from 'cors';
import env from './env.js';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export default cors({
  origin(origin, callback) {
    // Allow server-to-server and curl requests (no Origin header).
    if (!origin) return callback(null, true);
    // Allow configured origins.
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development, be permissive so the Vite dev server works out of the box.
    if (env.nodeEnv !== 'production') {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  maxAge: 600,
});