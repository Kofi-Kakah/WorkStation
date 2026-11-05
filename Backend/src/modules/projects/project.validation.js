import { z } from "zod";
import { ROLES } from "../../shared/services/permissionService.js";
import { idSchema } from "../../shared/validation/ids.js";

const projectId = idSchema;
const workspaceId = idSchema;
const userId = idSchema;
const name = z.string().trim().min(2).max(100);
const description = z.string().trim().max(2000);

export const projectParamsSchema = z.object({ projectId });
export const projectMemberParamsSchema = z.object({ projectId, userId });
export const listProjectsQuerySchema = z.object({ workspaceId });

export const createProjectSchema = z.object({
  workspaceId,
  name,
  description: description.optional().default(""),
  visibility: z.enum(["workspace", "restricted"]).optional().default("workspace"),
});

export const updateProjectSchema = z
  .object({
    name: name.optional(),
    description: description.optional(),
    visibility: z.enum(["workspace", "restricted"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one project field to update",
  });

export const addProjectMemberSchema = z.object({
  userId,
  role: z.enum([ROLES.PROJECT_MANAGER, ROLES.MEMBER]).default(ROLES.MEMBER),
});
