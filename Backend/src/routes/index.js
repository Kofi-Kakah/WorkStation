import { Router } from "express";
import health from "./health.js";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import workspaceRoutes from "../modules/workspaces/workspace.routes.js";
import projectRoutes from "../modules/projects/project.routes.js";
import invitationRoutes from "../modules/invitations/invitation.routes.js";
import channelRoutes from "../modules/channels/channel.routes.js";
import messageRoutes from "../modules/messages/message.routes.js";
import attachmentRoutes from "../modules/attachments/attachment.routes.js";
import boardRoutes from "../modules/boards/board.routes.js";
import issueRoutes from "../modules/issues/issue.routes.js";
import integrationRoutes from "../modules/integrations/integration.routes.js";

const router = Router();

router.use(health);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/projects", projectRoutes);
router.use("/invitations", invitationRoutes);
router.use("/channels", channelRoutes);
router.use("/channels", messageRoutes);
router.use("/channels", attachmentRoutes);
router.use("/messages", messageRoutes);
router.use("/boards", boardRoutes);
router.use("/issues", issueRoutes);
router.use("/integrations", integrationRoutes);

export default router;
