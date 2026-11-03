import cors from "cors";
import env from "./env.js";
import { Errors } from "../shared/errors/index.js";

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function isOriginAllowed(
  origin,
  origins = allowedOrigins,
  nodeEnv = env.nodeEnv,
) {
  if (!origin || origins.includes(origin)) return true;
  return nodeEnv !== "production";
}

export default cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(Errors.forbidden("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  maxAge: 600,
});
