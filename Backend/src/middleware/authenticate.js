import { createHash } from "node:crypto";
import { getAuth } from "../config/firebase.js";
import env from "../config/env.js";

const TOKEN_CACHE_MAX_ENTRIES = 500;
const tokenCache = new Map();

function cacheKey(token) {
  return createHash("sha256").update(token).digest("hex");
}

function readCachedUser(token) {
  if (!env.auth.tokenCacheMs) return null;
  const key = cacheKey(token);
  const entry = tokenCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    tokenCache.delete(key);
    return null;
  }
  return entry.user;
}

function cacheUser(token, user, expiresAt) {
  if (!env.auth.tokenCacheMs) return;
  const ttl = Math.min(
    env.auth.tokenCacheMs,
    Math.max(0, expiresAt - Date.now()),
  );
  if (ttl <= 0) return;
  if (tokenCache.size >= TOKEN_CACHE_MAX_ENTRIES) {
    const now = Date.now();
    for (const [key, entry] of tokenCache) {
      if (entry.expiresAt <= now) tokenCache.delete(key);
    }
    if (tokenCache.size >= TOKEN_CACHE_MAX_ENTRIES) {
      tokenCache.delete(tokenCache.keys().next().value);
    }
  }
  tokenCache.set(cacheKey(token), { user, expiresAt: Date.now() + ttl });
}

/**
 * Express middleware that verifies the Firebase ID token from the
 * `Authorization: Bearer <id-token>` header and attaches the decoded
 * user to `req.user`.
 *
 * The UID used for authorization is ALWAYS the one from the verified
 * token. A UID supplied by the client in the request body is ignored.
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = /^Bearer\s+(\S+)$/i.exec(header);

    if (!match) {
      return res
        .status(401)
        .json({ error: "Missing or malformed Authorization header" });
    }

    const token = match[1];
    const cachedUser = readCachedUser(token);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token, true);
    const user = {
      uid: decoded.uid,
      email: decoded.email || null,
      emailVerified: decoded.email_verified === true,
      name: decoded.name || null,
      picture: decoded.picture || null,
    };
    cacheUser(token, user, (decoded.exp || 0) * 1000);

    req.user = user;
    return next();
  } catch (error) {
    const authMessages = {
      "auth/argument-error": "Invalid ID token",
      "auth/invalid-id-token": "Invalid ID token",
      "auth/id-token-expired": "ID token has expired",
      "auth/id-token-revoked": "ID token has been revoked",
      "auth/user-disabled": "This account has been disabled",
      "auth/invalid-credential": "Invalid ID token",
    };
    const message = authMessages[error?.code];
    if (message) return res.status(401).json({ error: message });
    return next(error);
  }
}

export default authenticate;
