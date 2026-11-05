import { z } from "zod";
import { idSchema as id } from "../../shared/validation/ids.js";

const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(5000).default("");
const typeEnum = z.enum(["epic", "story", "task", "bug", "subtask"]);
const statusEnum = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
]);
const priorityEnum = z.enum([
  "lowest",
  "low",
  "medium",
  "high",
  "highest",
]);

export const issueParamsSchema = z.object({ issueId: id });
export const projectIssueQuerySchema = z.object({
  projectId: id,
  status: statusEnum.optional(),
  type: typeEnum.optional(),
  priority: priorityEnum.optional(),
  search: z.string().trim().max(200).optional(),
  assigneeId: id.optional(),
  dueDateFrom: z.string().trim().max(30).optional(),
  dueDateTo: z.string().trim().max(30).optional(),
  sprintId: id.optional(),
});

export const createIssueSchema = z.object({
  projectId: id,
  title,
  description,
  type: typeEnum.default("task"),
  status: statusEnum.default("backlog"),
  priority: priorityEnum.default("medium"),
  assigneeId: id.nullable().optional(),
  parentIssueId: id.nullable().optional(),
  labels: z.array(z.string().trim().min(1).max(40)).max(25).optional(),
  dueDate: z.string().trim().max(30).optional(),
});

export const updateIssueSchema = z
  .object({
    title: title.optional(),
    description: description.optional(),
    type: typeEnum.optional(),
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assigneeId: id.nullable().optional(),
    parentIssueId: id.nullable().optional(),
    labels: z.array(z.string().trim().min(1).max(40)).max(25).optional(),
    dueDate: z.string().trim().max(30).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one issue field to update",
  });

export const issueStatusSchema = z.object({ status: statusEnum });
export const issueAssigneeSchema = z.object({
  assigneeId: id.nullable().optional(),
});
export const issueCommentSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});
