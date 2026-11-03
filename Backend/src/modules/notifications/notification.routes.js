import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import NotificationController from "./notification.controller.js";
import {
  deviceTokenSchema,
  notificationListQuerySchema,
  notificationParamsSchema,
  removeDeviceSchema,
} from "./notification.validation.js";

const router = Router();
const controller = new NotificationController();

router.use(authenticate);
router.get(
  "/",
  validateQuery(notificationListQuerySchema),
  controller.list.bind(controller),
);
router.post("/read-all", controller.markAllRead.bind(controller));
router.post(
  "/devices",
  validateBody(deviceTokenSchema),
  controller.registerDevice.bind(controller),
);
router.delete(
  "/devices",
  validateBody(removeDeviceSchema),
  controller.removeDevice.bind(controller),
);
router.post(
  "/:notificationId/read",
  validateParams(notificationParamsSchema),
  controller.markRead.bind(controller),
);

export default router;