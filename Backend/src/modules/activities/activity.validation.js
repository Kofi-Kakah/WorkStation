import { z } from "zod";
import { idSchema as id } from "../../shared/validation/ids.js";

export const activityListQuerySchema = z.object({
  workspaceId: id,
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: id.optional(),
});
