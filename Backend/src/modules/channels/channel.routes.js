import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import ChannelController from "./channel.controller.js";
import {
  addChannelMemberSchema,
  channelMemberParamsSchema,
  channelParamsSchema,
  createChannelSchema,
  createConversationSchema,
  listChannelsQuerySchema,
  markReadSchema,
  typingSchema,
  updateChannelSchema,
} from "./channel.validation.js";

const router = Router();
const controller = new ChannelController();

router.use(authenticate);
router.get(
  "/",
  validateQuery(listChannelsQuerySchema),
  controller.list.bind(controller),
);
router.post(
  "/",
  validateBody(createChannelSchema),
  controller.create.bind(controller),
);
router.get(
  "/conversations",
  validateQuery(listChannelsQuerySchema),
  controller.listConversations.bind(controller),
);
router.post(
  "/conversations",
  validateBody(createConversationSchema),
  controller.createConversation.bind(controller),
);
router.post(
  "/:channelId/join",
  validateParams(channelParamsSchema),
  controller.join.bind(controller),
);
router.get(
  "/:channelId/members",
  validateParams(channelParamsSchema),
  controller.listMembers.bind(controller),
);
router.post(
  "/:channelId/members",
  validateParams(channelParamsSchema),
  validateBody(addChannelMemberSchema),
  controller.addMember.bind(controller),
);
router.delete(
  "/:channelId/members/:userId",
  validateParams(channelMemberParamsSchema),
  controller.removeMember.bind(controller),
);
router.post(
  "/:channelId/presence",
  validateParams(channelParamsSchema),
  validateBody(typingSchema.partial()),
  controller.heartbeat.bind(controller),
);
router.post(
  "/:channelId/read",
  validateParams(channelParamsSchema),
  validateBody(markReadSchema),
  controller.markRead.bind(controller),
);
router.get(
  "/:channelId",
  validateParams(channelParamsSchema),
  controller.get.bind(controller),
);
router.patch(
  "/:channelId",
  validateParams(channelParamsSchema),
  validateBody(updateChannelSchema),
  controller.update.bind(controller),
);

export default router;
