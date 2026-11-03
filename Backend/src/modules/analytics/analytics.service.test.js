import { describe, expect, it } from "vitest";
import AnalyticsService from "./analytics.service.js";

describe("AnalyticsService", () => {
  it("summarizes project progress, due dates, and team workload", async () => {
    const service = new AnalyticsService(
      {
        listForWorkspace: async () => [
          { id: "project-1", name: "Launch" },
          { id: "project-2", name: "Platform" },
        ],
      },
      {
        list: async (projectId) =>
          projectId === "project-1"
            ? [
                { id: "issue-1", status: "done", assigneeId: "member-1" },
                {
                  id: "issue-2",
                  status: "todo",
                  assigneeId: "member-1",
                  dueDate: new Date(Date.now() - 86400000).toISOString(),
                },
              ]
            : [{ id: "issue-3", status: "in_progress", assigneeId: null }],
      },
    );

    const result = await service.workspace("workspace-1", "member-1", {
      includeIssues: true,
    });

    expect(result.summary).toMatchObject({
      projectCount: 2,
      totalIssues: 3,
      completedIssues: 1,
      activeIssues: 2,
      overdueIssues: 1,
    });
    expect(result.workload).toEqual(
      expect.arrayContaining([
        { assigneeId: "member-1", total: 2, active: 1, overdue: 1 },
        { assigneeId: null, total: 1, active: 1, overdue: 0 },
      ]),
    );
    expect(result.issues).toHaveLength(3);
  });
});
