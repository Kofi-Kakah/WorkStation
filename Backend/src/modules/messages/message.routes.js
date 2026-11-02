import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import MessageController from "./message.controller.js";
import {
  channelMessageParamsSchema,
  createMessageSchema,
  messageListQuerySchema,
  messageParamsSchema,
  searchMessagesQuerySchema,
  toggleReactionSchema,
  updateMessageSchema,
} from "./message.validation.js";

const router = Router();
const controller = new MessageController();

router.use(authenticate);
router.get(
  "/search",
  validateQuery(searchMessagesQuerySchema),
  controller.search.bind(controller),
);
router.get(
  "/:channelId/events",
  validateParams(channelMessageParamsSchema),
  controller.events.bind(controller),
);
router.get(
  "/:channelId/messages",
  validateParams(channelMessageParamsSchema),
  validateQuery(messageListQuerySchema),
  controller.list.bind(controller),
);
router.get(
  "/:channelId/messages/:messageId",
  validateParams(messageParamsSchema),
  controller.get.bind(controller),
);
router.post(
  "/:channelId/messages",
  validateParams(channelMessageParamsSchema),
  validateBody(createMessageSchema),
  controller.create.bind(controller),
);
router.patch(
  "/:channelId/messages/:messageId",
  validateParams(messageParamsSchema),
  validateBody(updateMessageSchema),
  controller.update.bind(controller),
);
router.delete(
  "/:channelId/messages/:messageId",
  validateParams(messageParamsSchema),
  controller.remove.bind(controller),
);
router.post(
  "/:channelId/messages/:messageId/reactions",
  validateParams(messageParamsSchema),
  validateBody(toggleReactionSchema),
  controller.toggleReaction.bind(controller),
);

export default router;
