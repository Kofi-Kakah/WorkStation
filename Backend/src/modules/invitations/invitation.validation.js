import { z } from "zod";
import { idSchema as id } from "../../shared/validation/ids.js";

export const invitationWorkspaceParamsSchema = z.object({
  workspaceId: id,
});

export const invitationTokenParamsSchema = z.object({
  token: z.string().min(40).max(100),
});
