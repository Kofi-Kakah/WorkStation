import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateQuery } from "../../middleware/validate.js";
import ActivityController from "./activity.controller.js";
import { activityListQuerySchema } from "./activity.validation.js";

const router = Router();
const controller = new ActivityController();

router.get(
  "/",
  authenticate,
  validateQuery(activityListQuerySchema),
  controller.list.bind(controller),
);

export default router;
