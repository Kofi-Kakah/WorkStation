import { z } from "zod";
import { idSchema as id } from "../../shared/validation/ids.js";

export const channelParamsSchema = z.object({ channelId: id });
export const channelMemberParamsSchema = z.object({
  channelId: id,
  userId: id,
});
export const listChannelsQuerySchema = z.object({ workspaceId: id });

export const createChannelSchema = z.object({
  workspaceId: id,
  name: z.string().trim().min(1).max(80),
  topic: z.string().trim().max(280).optional().default(""),
  visibility: z.enum(["public", "private"]).optional().default("public"),
  memberIds: z.array(id).max(50).optional().default([]),
});

export const updateChannelSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    topic: z.string().trim().max(280).optional(),
    archived: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one channel field to update",
  });

export const addChannelMemberSchema = z.object({ userId: id });
export const createConversationSchema = z.object({
  workspaceId: id,
  memberIds: z.array(id).min(1).max(19),
  name: z.string().trim().min(1).max(80).optional(),
});

export const typingSchema = z.object({ isTyping: z.boolean() });
export const markReadSchema = z.object({ messageId: id.optional() });
