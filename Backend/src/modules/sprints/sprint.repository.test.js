import { describe, expect, it } from "vitest";
import SprintRepository from "./sprint.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

function fixture() {
  return new Map([
    ["workspaces/workspace-1", { name: "Team" }],
    ["workspaces/workspace-1/members/manager-1", { role: "owner" }],
    [
      "projects/project-1",
      {
        workspaceId: "workspace-1",
        status: "active",
        visibility: "workspace",
      },
    ],
    ["projects/project-1/members/manager-1", { role: "project_manager" }],
    ["issues/issue-1", { projectId: "project-1", title: "In scope" }],
    ["issues/issue-2", { projectId: "project-2", title: "Out of scope" }],
  ]);
}

describe("SprintRepository", () => {
  it("creates a planned sprint for a project manager", async () => {
    const db = createFakeFirestore(fixture());
    const repository = new SprintRepository(db);

    const sprint = await repository.create("manager-1", {
      projectId: "project-1",
      name: "Iteration 1",
      goal: "Complete onboarding",
      startDate: "2026-11-01",
      endDate: "2026-11-14",
    });

    expect(sprint).toMatchObject({
      projectId: "project-1",
      workspaceId: "workspace-1",
      status: "planned",
      name: "Iteration 1",
    });
  });

  it("assigns issues atomically and rejects issues from another project", async () => {
    const db = createFakeFirestore(
      new Map([
        ...fixture(),
        ["sprints/sprint-1", {
          projectId: "project-1",
          status: "planned",
        }],
      ]),
    );
    const repository = new SprintRepository(db);

    await expect(
      repository.assignIssues("sprint-1", "manager-1", ["issue-1", "issue-2"]),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(db.get("issues/issue-1").sprintId).toBeUndefined();
    expect(db.writes).toHaveLength(0);

    await expect(
      repository.assignIssues("sprint-1", "manager-1", ["issue-1"]),
    ).resolves.toEqual({ sprintId: "sprint-1", assignedCount: 1 });
    expect(db.get("issues/issue-1").sprintId).toBe("sprint-1");
  });

  it("blocks workspace members from creating sprints", async () => {
    const documents = fixture();
    documents.set("workspaces/workspace-1/members/manager-1", { role: "member" });
    documents.set("projects/project-1/members/manager-1", { role: "member" });
    const db = createFakeFirestore(documents);
    const repository = new SprintRepository(db);

    await expect(
      repository.create("manager-1", {
        projectId: "project-1",
        name: "Unauthorized",
        goal: "",
        startDate: "2026-11-01",
        endDate: "2026-11-14",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(db.writes).toHaveLength(0);
  });

  it("enforces the planned-to-active-to-completed sprint lifecycle", async () => {
    const documents = fixture();
    documents.set("sprints/sprint-1", {
      projectId: "project-1",
      status: "planned",
    });
    const db = createFakeFirestore(documents);
    const repository = new SprintRepository(db);

    await expect(
      repository.setStatus("sprint-1", "manager-1", "active"),
    ).resolves.toMatchObject({ status: "active" });
    await expect(
      repository.setStatus("sprint-1", "manager-1", "completed"),
    ).resolves.toMatchObject({ status: "completed" });
    await expect(
      repository.setStatus("sprint-1", "manager-1", "active"),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});
