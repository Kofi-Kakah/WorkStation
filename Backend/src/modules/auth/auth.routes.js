import { Router } from "express";
import { getAuth } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import authenticate from "../../middleware/authenticate.js";
import UserService from "../../modules/users/user.service.js";
import { z } from "zod";

const router = Router();
const auth = getAuth();
const userService = new UserService();

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1).max(100).optional(),
});

const resetRequestSchema = z.object({
  email: z.string().email("Invalid email"),
});

const resetConfirmSchema = z.object({
  oobCode: z.string().min(1).max(2048),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = registerSchema.parse(req.body);

    let existingUser = null;
    try {
      existingUser = await auth.getUserByEmail(email);
    } catch (err) {
      if (err?.code !== "auth/user-not-found") throw err;
    }
    if (existingUser) throw Errors.conflict("Email already in use");

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split("@")[0],
    });

    const customToken = await auth.createCustomToken(userRecord.uid);

    return res.json({
      ok: true,
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      customToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", (_req, res) => {
  return res.status(410).json({
    error: "Sign in using Firebase Authentication",
    code: "FIREBASE_AUTH_REQUIRED",
  });
});

router.post("/password-reset/request", async (req, res, next) => {
  try {
    const { email } = resetRequestSchema.parse(req.body);
    try {
      await auth.getUserByEmail(email);
      const link = await auth.generatePasswordResetLink(email);
      return res.json({
        ok: true,
        link: process.env.NODE_ENV !== "production" ? link : undefined,
      });
    } catch (err) {
      if (err?.code === "auth/user-not-found") return res.json({ ok: true });
      throw err;
    }
  } catch (error) {
    next(error);
  }
});

router.post("/password-reset/confirm", async (req, res, next) => {
  try {
    const { oobCode, newPassword } = resetConfirmSchema.parse(req.body);
    await auth.confirmPasswordReset(oobCode, newPassword);
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) throw Errors.validation("idToken is required");

    const decoded = await auth.verifyIdToken(idToken, true);
    const userRecord = await auth.getUser(decoded.uid);
    const profile = await userService.ensureProfile(userRecord);

    return res.json({
      ok: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const userRecord = await auth.getUser(req.user.uid);
    const profile = await userService.ensureProfile(userRecord);
    return res.json({
      ok: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
