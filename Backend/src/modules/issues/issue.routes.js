import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import IssueController from "./issue.controller.js";
import {
  createIssueSchema,
  issueAssigneeSchema,
  issueCommentSchema,
  issueParamsSchema,
  issueStatusSchema,
  projectIssueQuerySchema,
  updateIssueSchema,
} from "./issue.validation.js";

const router = Router();
const controller = new IssueController();

router.use(authenticate);
router.get(
  "/",
  validateQuery(projectIssueQuerySchema),
  controller.list.bind(controller),
);
router.post(
  "/",
  validateBody(createIssueSchema),
  controller.create.bind(controller),
);
router.get(
  "/:issueId",
  validateParams(issueParamsSchema),
  controller.get.bind(controller),
);
router.patch(
  "/:issueId",
  validateParams(issueParamsSchema),
  validateBody(updateIssueSchema),
  controller.update.bind(controller),
);
router.patch(
  "/:issueId/status",
  validateParams(issueParamsSchema),
  validateBody(issueStatusSchema),
  controller.updateStatus.bind(controller),
);
router.patch(
  "/:issueId/assignee",
  validateParams(issueParamsSchema),
  validateBody(issueAssigneeSchema),
  controller.updateAssignee.bind(controller),
);
router.get(
  "/:issueId/comments",
  validateParams(issueParamsSchema),
  controller.listComments.bind(controller),
);
router.post(
  "/:issueId/comments",
  validateParams(issueParamsSchema),
  validateBody(issueCommentSchema),
  controller.createComment.bind(controller),
);

export default router;
