import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { z } from "zod";
import WorkspaceController from "./workspace.controller.js";
import InvitationController from "./invitation.controller.js";

const router = Router();
const ctrl = new WorkspaceController();
const invCtrl = new InvitationController();

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().min(2).max(64).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  slug: z.string().min(2).max(64).optional(),
  visibility: z.enum(["public", "private"]).optional(),
  settings: z.object({
    allowGuestAccess: z.boolean().optional(),
    defaultProjectVisibility: z.enum(["public", "private"]).optional(),
  }).optional(),
});

const widParamSchema = z.object({ workspaceId: z.string().min(1) });

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "project_manager", "member", "guest"]).optional(),
});

const updateMemberSchema = z.object({
  role: z.enum(["owner", "admin", "project_manager", "member", "guest"]),
});

router.get("/", authenticate, ctrl.list);
router.post("/", authenticate, validateBody(createSchema), ctrl.create);
router.get("/:workspaceId", authenticate, validateParams(widParamSchema), ctrl.get);
router.patch("/:workspaceId", authenticate, validateParams(widParamSchema), validateBody(updateSchema), ctrl.update);
router.delete("/:workspaceId", authenticate, validateParams(widParamSchema), ctrl.remove);

router.get("/:workspaceId/members", authenticate, validateParams(widParamSchema), ctrl.listMembers);
router.post("/:workspaceId/members", authenticate, validateParams(widParamSchema), validateBody(inviteSchema), ctrl.addMember);
router.patch("/:workspaceId/members/:memberId", authenticate, validateParams(widParamSchema), validateBody(updateMemberSchema), ctrl.updateMemberRole);
router.delete("/:workspaceId/members/:memberId", authenticate, validateParams(widParamSchema), ctrl.removeMember);

router.get("/:workspaceId/invitations", authenticate, validateParams(widParamSchema), ctrl.listInvitations);
router.post("/:workspaceId/invitations", authenticate, validateParams(widParamSchema), validateBody(inviteSchema), ctrl.createInvitation);
router.delete("/:workspaceId/invitations/:invitationId", authenticate, validateParams(widParamSchema), ctrl.revokeInvitation);

router.get("/invitations/:token", authenticate, invCtrl.get);
router.post("/invitations/:token/accept", authenticate, invCtrl.accept);
router.post("/invitations/:token/reject", authenticate, invCtrl.reject);

export default router;
