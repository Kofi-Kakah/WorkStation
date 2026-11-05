import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { z } from "zod";
import UserController from "./user.controller.js";
import { idSchema } from "../../shared/validation/ids.js";

const router = Router();
const ctrl = new UserController();

const avatarUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    message: "Avatar URL must use http or https",
  });

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: avatarUrlSchema.optional(),
  timezone: z.string().max(64).optional(),
  locale: z.string().max(16).optional(),
  notificationPreferences: z
    .object({
      email: z.boolean().optional(),
      inApp: z.boolean().optional(),
      push: z.boolean().optional(),
    })
    .optional(),
});

const uidParamSchema = z.object({ userId: idSchema });

router.get("/me", authenticate, ctrl.getMe);
router.patch(
  "/me",
  authenticate,
  validateBody(updateProfileSchema),
  ctrl.updateMe,
);
router.get(
  "/:userId",
  authenticate,
  validateParams(uidParamSchema),
  ctrl.getProfile,
);

export default router;
