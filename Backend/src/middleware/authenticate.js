import { getAuth } from "../config/firebase.js";

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
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .json({ error: "Missing or malformed Authorization header" });
    }

    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token, true);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      emailVerified: decoded.email_verified === true,
      name: decoded.name || null,
      picture: decoded.picture || null,
    };

    return next();
  } catch (error) {
    const message =
      error?.code === "auth/id-token-expired"
        ? "ID token has expired"
        : error?.code === "auth/id-token-revoked"
          ? "ID token has been revoked"
          : "Invalid ID token";

    return res.status(401).json({ error: message });
  }
}

export default authenticate;
