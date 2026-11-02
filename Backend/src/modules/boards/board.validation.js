import { z } from "zod";

const id = z.string().trim().min(1).max(128);
const name = z.string().trim().min(1).max(80);

export const boardParamsSchema = z.object({ boardId: id });
export const projectBoardQuerySchema = z.object({ projectId: id });
export const createBoardSchema = z.object({
  projectId: id,
  name,
  description: z.string().trim().max(1000).optional().default(""),
});
export const updateBoardSchema = z
  .object({
    name: name.optional(),
    description: z.string().trim().max(1000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one board field to update",
  });
export const createListSchema = z.object({ name });
export const updateListSchema = z.object({ name });
export const listParamsSchema = z.object({ boardId: id, listId: id });
export const cardParamsSchema = z.object({ boardId: id, cardId: id });
export const reorderListsSchema = z.object({
  listIds: z.array(id).min(1).max(100),
});
export const createCardSchema = z.object({
  issueId: id,
  listId: id,
});
export const moveCardSchema = z.object({
  listId: id,
  position: z.number().int().min(0).max(400),
});
