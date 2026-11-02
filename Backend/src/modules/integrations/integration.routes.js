import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import IntegrationController from "./integration.controller.js";
import {
  messageConversionParamsSchema,
  messageConversionSchema,
} from "./integration.validation.js";

const router = Router();
const controller = new IntegrationController();

router.use(authenticate);
router.post(
  "/messages/:messageId/convert-to-issue",
  validateParams(messageConversionParamsSchema),
  validateBody(messageConversionSchema),
  controller.convertMessageToIssue.bind(controller),
);

export default router;
