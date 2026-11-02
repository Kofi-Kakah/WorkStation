import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateParams } from "../../middleware/validate.js";
import InvitationController from "./invitation.controller.js";
import { invitationTokenParamsSchema } from "./invitation.validation.js";

const router = Router();
const controller = new InvitationController();

router.use(authenticate);
router.post(
  "/:token/accept",
  validateParams(invitationTokenParamsSchema),
  controller.accept.bind(controller),
);
router.post(
  "/:token/reject",
  validateParams(invitationTokenParamsSchema),
  controller.reject.bind(controller),
);

export default router;
