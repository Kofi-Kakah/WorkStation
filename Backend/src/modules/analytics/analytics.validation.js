import { z } from "zod";
import { idSchema as id } from "../../shared/validation/ids.js";

export const workspaceAnalyticsQuerySchema = z.object({
  workspaceId: id,
  includeIssues: z.enum(["true", "false"]).optional(),
});
