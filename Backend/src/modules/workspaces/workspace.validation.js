import { z } from "zod";
import { ROLES } from "../../shared/services/permissionService.js";
import { idSchema } from "../../shared/validation/ids.js";

const name = z.string().trim().min(2).max(80);
const description = z.string().trim().max(500);
const workspaceId = idSchema;
const userId = idSchema;

export const createWorkspaceSchema = z.object({
  name,
  description: description.optional().default(""),
});

export const updateWorkspaceSchema = z
  .object({
    name: name.optional(),
    description: description.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one workspace field to update",
  });

export const workspaceParamsSchema = z.object({ workspaceId });
export const memberParamsSchema = z.object({ workspaceId, userId });

export const updateMemberRoleSchema = z.object({
  role: z.enum([
    ROLES.ADMIN,
    ROLES.PROJECT_MANAGER,
    ROLES.MEMBER,
    ROLES.GUEST,
  ]),
});

export const createInvitationSchema = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum([
    ROLES.PROJECT_MANAGER,
    ROLES.MEMBER,
    ROLES.GUEST,
  ]).default(ROLES.MEMBER),
});
