import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import WorkspaceController from "./workspace.controller.js";
import InvitationController from "../invitations/invitation.controller.js";
import { invitationWorkspaceParamsSchema } from "../invitations/invitation.validation.js";
import {
  createWorkspaceSchema,
  createInvitationSchema,
  memberParamsSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
  workspaceParamsSchema,
} from "./workspace.validation.js";

const router = Router();
const controller = new WorkspaceController();
const invitationController = new InvitationController();

router.use(authenticate);
router.get("/", controller.list.bind(controller));
router.post(
  "/",
  validateBody(createWorkspaceSchema),
  controller.create.bind(controller),
);
router.get(
  "/:workspaceId",
  validateParams(workspaceParamsSchema),
  controller.get.bind(controller),
);
router.patch(
  "/:workspaceId",
  validateParams(workspaceParamsSchema),
  validateBody(updateWorkspaceSchema),
  controller.update.bind(controller),
);
router.get(
  "/:workspaceId/members",
  validateParams(workspaceParamsSchema),
  controller.listMembers.bind(controller),
);
router.patch(
  "/:workspaceId/members/:userId",
  validateParams(memberParamsSchema),
  validateBody(updateMemberRoleSchema),
  controller.updateMemberRole.bind(controller),
);
router.delete(
  "/:workspaceId/members/:userId",
  validateParams(memberParamsSchema),
  controller.removeMember.bind(controller),
);
router.get(
  "/:workspaceId/invitations",
  validateParams(invitationWorkspaceParamsSchema),
  invitationController.list.bind(invitationController),
);
router.post(
  "/:workspaceId/invitations",
  validateParams(invitationWorkspaceParamsSchema),
  validateBody(createInvitationSchema),
  invitationController.create.bind(invitationController),
);

export default router;
