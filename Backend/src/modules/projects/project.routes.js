import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import ProjectController from "./project.controller.js";
import {
  addProjectMemberSchema,
  createProjectSchema,
  listProjectsQuerySchema,
  projectMemberParamsSchema,
  projectParamsSchema,
  updateProjectSchema,
} from "./project.validation.js";

const router = Router();
const controller = new ProjectController();

router.use(authenticate);
router.get(
  "/",
  validateQuery(listProjectsQuerySchema),
  controller.list.bind(controller),
);
router.post(
  "/",
  validateBody(createProjectSchema),
  controller.create.bind(controller),
);
router.get(
  "/:projectId/members",
  validateParams(projectParamsSchema),
  controller.listMembers.bind(controller),
);
router.post(
  "/:projectId/members",
  validateParams(projectParamsSchema),
  validateBody(addProjectMemberSchema),
  controller.addMember.bind(controller),
);
router.delete(
  "/:projectId/members/:userId",
  validateParams(projectMemberParamsSchema),
  controller.removeMember.bind(controller),
);
router.patch(
  "/:projectId/archive",
  validateParams(projectParamsSchema),
  controller.archive.bind(controller),
);
router.delete(
  "/:projectId",
  validateParams(projectParamsSchema),
  controller.remove.bind(controller),
);
router.get(
  "/:projectId",
  validateParams(projectParamsSchema),
  controller.get.bind(controller),
);
router.patch(
  "/:projectId",
  validateParams(projectParamsSchema),
  validateBody(updateProjectSchema),
  controller.update.bind(controller),
);

export default router;
