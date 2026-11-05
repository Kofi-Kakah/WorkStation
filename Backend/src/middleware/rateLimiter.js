import rateLimit from "express-rate-limit";
import env from "../config/env.js";

export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skipSuccessfulRequests: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
});

/**
 * Uploads are authenticated before this limiter runs, so key by user ID.
 * This prevents one account from saturating Storage while sharing an IP.
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.uid ? `user:${req.user.uid}` : `ip:${req.ip}`,
  message: {
    error: "Too many uploads, please wait before trying again.",
  },
});

export default { apiLimiter, authLimiter, uploadLimiter };
