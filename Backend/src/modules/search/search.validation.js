import { z } from "zod";

export const globalSearchQuerySchema = z.object({
  workspaceId: z.string().trim().min(1).max(128),
  query: z.string().trim().min(2).max(120),
});
