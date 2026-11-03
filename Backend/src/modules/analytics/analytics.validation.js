import { z } from "zod";

export const workspaceAnalyticsQuerySchema = z.object({
  workspaceId: z.string().trim().min(1).max(128),
  includeIssues: z.enum(["true", "false"]).optional(),
});
