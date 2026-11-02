import { z } from "zod";

export const invitationWorkspaceParamsSchema = z.object({
  workspaceId: z.string().min(1),
});

export const invitationTokenParamsSchema = z.object({
  token: z.string().min(40).max(100),
});
