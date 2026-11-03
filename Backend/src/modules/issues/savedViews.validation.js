import { z } from "zod";

const id = z.string().trim().min(1).max(128);
const filters = z
  .object({
    projectId: id.optional(),
    status: z.enum(["all", "backlog", "todo", "in_progress", "in_review", "done"]).optional(),
    type: z.enum(["all", "epic", "story", "task", "bug", "subtask"]).optional(),
    priority: z.enum(["all", "lowest", "low", "medium", "high", "highest"]).optional(),
    assigneeId: z.string().trim().max(128).optional(),
    dueDateFrom: z.string().trim().max(30).optional(),
    dueDateTo: z.string().trim().max(30).optional(),
    search: z.string().trim().max(120).optional(),
    sprintId: z.string().trim().max(128).optional(),
  })
  .strict();

export const savedViewsQuerySchema = z.object({ workspaceId: id });
export const savedViewParamsSchema = z.object({ viewId: id });
export const createSavedViewSchema = z.object({
  workspaceId: id,
  name: z.string().trim().min(1).max(60),
  filters,
});
