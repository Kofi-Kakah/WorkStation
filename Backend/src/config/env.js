import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export default {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  apiVersion: process.env.API_VERSION || "v1",
  firebase: {
    projectId:
      process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
  },
  // Cloud Run terminates TLS in front of the container, so rate limiting
  // must trust exactly one proxy hop to see the real client IP.
  trustProxy: process.env.TRUST_PROXY === "true" ? 1 : false,
  auth: {
    // Cache verified ID tokens briefly to avoid an Auth round trip on every
    // request. Revocations still take effect within this window.
    tokenCacheMs: Math.max(0, Number(process.env.AUTH_TOKEN_CACHE_MS) || 60000),
  },
};
