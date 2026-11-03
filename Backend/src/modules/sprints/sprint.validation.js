import { z } from "zod";

const id = z.string().trim().min(1).max(128);

export const projectSprintsQuerySchema = z.object({ projectId: id });
export const sprintParamsSchema = z.object({ sprintId: id });
export const createSprintSchema = z.object({
  projectId: id,
  name: z.string().trim().min(1).max(80),
  goal: z.string().trim().max(1000).default(""),
  startDate: z.string().date(),
  endDate: z.string().date(),
}).refine((value) => value.endDate >= value.startDate, {
  message: "Sprint end date must be on or after its start date",
});
export const sprintStatusSchema = z.object({
  status: z.enum(["planned", "active", "completed"]),
});
export const sprintIssuesSchema = z.object({
  issueIds: z.array(id).max(100),
});
