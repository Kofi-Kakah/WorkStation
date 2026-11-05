import { z } from "zod";
import { idSchema as id } from "../../shared/validation/ids.js";

const content = z.string().trim().min(1).max(8000);

export const channelMessageParamsSchema = z.object({ channelId: id });
export const messageParamsSchema = z.object({
  channelId: id,
  messageId: id,
});
export const messageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  before: id.optional(),
  parentMessageId: id.optional(),
});
export const createMessageSchema = z.object({
  content: z.string().trim().max(8000).optional().default(""),
  parentMessageId: id.optional().nullable().default(null),
  mentions: z.array(id).max(20).optional().default([]),
  attachmentIds: z.array(id).max(10).optional().default([]),
}).refine(
  (message) => message.content.length > 0 || message.attachmentIds.length > 0,
  { message: "Add a message or at least one attachment" },
);
export const updateMessageSchema = z.object({
  content,
  mentions: z.array(id).max(20).optional(),
});
export const toggleReactionSchema = z.object({
  emoji: z.enum(["👍", "❤️", "😂", "🎉", "👀", "🙏"]),
});
export const searchMessagesQuerySchema = z.object({
  channelId: id,
  query: z.string().trim().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
