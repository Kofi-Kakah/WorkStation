import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import SavedViewsController from "./savedViews.controller.js";
import {
  createSavedViewSchema,
  savedViewParamsSchema,
  savedViewsQuerySchema,
} from "./savedViews.validation.js";

const router = Router();
const controller = new SavedViewsController();

router.use(authenticate);
router.get("/", validateQuery(savedViewsQuerySchema), controller.list.bind(controller));
router.post("/", validateBody(createSavedViewSchema), controller.create.bind(controller));
router.delete(
  "/:viewId",
  validateParams(savedViewParamsSchema),
  validateQuery(savedViewsQuerySchema),
  controller.remove.bind(controller),
);

export default router;
