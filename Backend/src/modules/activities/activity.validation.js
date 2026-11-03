import { z } from "zod";

export const activityListQuerySchema = z.object({
  workspaceId: z.string().trim().min(1).max(128),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().trim().min(1).max(128).optional(),
});
