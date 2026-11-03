import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateQuery } from "../../middleware/validate.js";
import AnalyticsController from "./analytics.controller.js";
import { workspaceAnalyticsQuerySchema } from "./analytics.validation.js";

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate);
router.get(
  "/workspace",
  validateQuery(workspaceAnalyticsQuerySchema),
  controller.workspace.bind(controller),
);

export default router;
