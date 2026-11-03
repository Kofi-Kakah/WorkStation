import { z } from "zod";

const id = z.string().trim().min(1).max(128);
const pageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: id.optional(),
  unreadOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const notificationListQuerySchema = pageQuery;
export const notificationParamsSchema = z.object({ notificationId: id });
export const deviceTokenSchema = z.object({
  token: z.string().trim().min(1).max(4096),
  userAgent: z.string().trim().max(512).optional(),
});
export const removeDeviceSchema = z.object({
  token: z.string().trim().min(1).max(4096),
});

