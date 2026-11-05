import { z } from "zod";
import { idSchema as id } from "../../shared/validation/ids.js";

export const globalSearchQuerySchema = z.object({
  workspaceId: id,
  query: z.string().trim().min(2).max(120),
});
