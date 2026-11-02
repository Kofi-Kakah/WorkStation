import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.js";
import BoardController from "./board.controller.js";
import {
  boardParamsSchema,
  cardParamsSchema,
  createBoardSchema,
  createCardSchema,
  createListSchema,
  listParamsSchema,
  moveCardSchema,
  projectBoardQuerySchema,
  reorderListsSchema,
  updateBoardSchema,
  updateListSchema,
} from "./board.validation.js";

const router = Router();
const controller = new BoardController();

router.use(authenticate);
router.get(
  "/",
  validateQuery(projectBoardQuerySchema),
  controller.list.bind(controller),
);
router.post("/", validateBody(createBoardSchema), controller.create.bind(controller));
router.get(
  "/:boardId",
  validateParams(boardParamsSchema),
  controller.get.bind(controller),
);
router.patch(
  "/:boardId",
  validateParams(boardParamsSchema),
  validateBody(updateBoardSchema),
  controller.update.bind(controller),
);
router.delete(
  "/:boardId",
  validateParams(boardParamsSchema),
  controller.archive.bind(controller),
);
router.post(
  "/:boardId/lists",
  validateParams(boardParamsSchema),
  validateBody(createListSchema),
  controller.createList.bind(controller),
);
router.post(
  "/:boardId/lists/reorder",
  validateParams(boardParamsSchema),
  validateBody(reorderListsSchema),
  controller.reorderLists.bind(controller),
);
router.patch(
  "/:boardId/lists/:listId",
  validateParams(listParamsSchema),
  validateBody(updateListSchema),
  controller.updateList.bind(controller),
);
router.delete(
  "/:boardId/lists/:listId",
  validateParams(listParamsSchema),
  controller.deleteList.bind(controller),
);
router.post(
  "/:boardId/cards",
  validateParams(boardParamsSchema),
  validateBody(createCardSchema),
  controller.createCard.bind(controller),
);
router.patch(
  "/:boardId/cards/:cardId/move",
  validateParams(cardParamsSchema),
  validateBody(moveCardSchema),
  controller.moveCard.bind(controller),
);
router.delete(
  "/:boardId/cards/:cardId",
  validateParams(cardParamsSchema),
  controller.removeCard.bind(controller),
);

export default router;
