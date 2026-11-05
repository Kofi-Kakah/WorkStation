import { z } from "zod";
import { idSchema as id } from "../../shared/validation/ids.js";

export const messageConversionParamsSchema = z.object({ messageId: id });
export const messageConversionSchema = z.object({
  channelId: id,
  projectId: id,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).default(""),
  type: z.enum(["epic", "story", "task", "bug", "subtask"]).default("task"),
  priority: z
    .enum(["lowest", "low", "medium", "high", "highest"])
    .default("medium"),
  assigneeId: id.nullable().optional(),
});
