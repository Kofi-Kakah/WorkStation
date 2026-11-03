import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validateQuery } from "../../middleware/validate.js";
import SearchController from "./search.controller.js";
import { globalSearchQuerySchema } from "./search.validation.js";

const router = Router();
const controller = new SearchController();

router.use(authenticate);
router.get(
  "/",
  validateQuery(globalSearchQuerySchema),
  controller.search.bind(controller),
);

export default router;
