import express, { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateParams } from "../../middleware/validate.js";
import AttachmentController from "./attachment.controller.js";
import { channelMessageParamsSchema } from "../messages/message.validation.js";

const router = Router();
const controller = new AttachmentController();

router.use(authenticate);
router.put(
  "/:channelId/uploads/:uploadId",
  validateParams(channelMessageParamsSchema.extend({ uploadId: channelMessageParamsSchema.shape.channelId })),
  express.raw({ type: "application/octet-stream", limit: "10mb" }),
  controller.upload.bind(controller),
);

export default router;
