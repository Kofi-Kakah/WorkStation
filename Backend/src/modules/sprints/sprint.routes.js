import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import SprintController from "./sprint.controller.js";
import {
  createSprintSchema,
  projectSprintsQuerySchema,
  sprintIssuesSchema,
  sprintParamsSchema,
  sprintStatusSchema,
} from "./sprint.validation.js";

const router = Router();
const controller = new SprintController();

router.use(authenticate);
router.get("/", validateQuery(projectSprintsQuerySchema), controller.list.bind(controller));
router.post("/", validateBody(createSprintSchema), controller.create.bind(controller));
router.patch(
  "/:sprintId/status",
  validateParams(sprintParamsSchema),
  validateBody(sprintStatusSchema),
  controller.setStatus.bind(controller),
);
router.put(
  "/:sprintId/issues",
  validateParams(sprintParamsSchema),
  validateBody(sprintIssuesSchema),
  controller.assignIssues.bind(controller),
);

export default router;
