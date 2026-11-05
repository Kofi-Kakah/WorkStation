import { describe, expect, it } from "vitest";
import ProjectRepository from "./project.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

describe("ProjectRepository", () => {
  it("only lets workspace project managers create projects", async () => {
    const db = createFakeFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
      ]),
    );
    const repository = new ProjectRepository(db);

    await expect(
      repository.create("workspace-1", "member-1", {
        name: "Roadmap",
        description: "",
        visibility: "workspace",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(db.writes).toHaveLength(0);
  });

  it("creates a project and assigns its creator as the first project manager", async () => {
    const db = createFakeFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/owner-1", { role: "owner" }],
      ]),
    );
    const repository = new ProjectRepository(db);

    const project = await repository.create("workspace-1", "owner-1", {
      name: "Roadmap",
      description: "Plan the release",
      visibility: "restricted",
    });

    expect(project).toMatchObject({
      workspaceId: "workspace-1",
      name: "Roadmap",
      key: expect.stringMatching(/^ROADM-/),
      currentUserProjectRole: "project_manager",
    });
    expect(db.writes.map(({ operation }) => operation)).toEqual([
      "create",
      "create",
    ]);
  });

  it("hides restricted projects from ordinary workspace members", async () => {
    const db = createFakeFirestore(
      new Map([
        [
          "projects/project-1",
          {
            workspaceId: "workspace-1",
            name: "Private",
            status: "active",
            visibility: "restricted",
          },
        ],
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
      ]),
    );
    const repository = new ProjectRepository(db);

    await expect(repository.get("project-1", "member-1")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("shows a restricted project to its explicit project member", async () => {
    const db = createFakeFirestore(
      new Map([
        [
          "projects/project-1",
          {
            workspaceId: "workspace-1",
            name: "Private",
            status: "active",
            visibility: "restricted",
          },
        ],
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
        ["projects/project-1/members/member-1", { role: "member" }],
      ]),
    );
    const repository = new ProjectRepository(db);

    await expect(repository.get("project-1", "member-1")).resolves.toMatchObject({
      id: "project-1",
      visibility: "restricted",
    });
  });

  it("does not list workspace-visible projects for guests without membership", async () => {
    const db = createFakeFirestore(
      new Map([
        [
          "projects/project-1",
          {
            workspaceId: "workspace-1",
            name: "Public to the team",
            status: "active",
            visibility: "workspace",
          },
        ],
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/guest-1", { role: "guest" }],
      ]),
    );
    const repository = new ProjectRepository(db);

    await expect(
      repository.listForWorkspace("workspace-1", "guest-1"),
    ).resolves.toEqual([]);
    await expect(repository.get("project-1", "guest-1")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("prevents removing the last project manager", async () => {
    const db = createFakeFirestore(
      new Map([
        [
          "projects/project-1",
          { workspaceId: "workspace-1", status: "active" },
        ],
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/owner-1", { role: "owner" }],
        [
          "projects/project-1/members/owner-1",
          { userId: "owner-1", role: "project_manager" },
        ],
      ]),
    );
    const repository = new ProjectRepository(db);

    await expect(
      repository.removeMember("project-1", "owner-1", "owner-1"),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(db.writes).toHaveLength(0);
  });

  it("only permits workspace owners and admins to delete projects", async () => {
    const db = createFakeFirestore(
      new Map([
        [
          "projects/project-1",
          { workspaceId: "workspace-1", status: "active" },
        ],
        ["workspaces/workspace-1", { name: "Team" }],
        [
          "workspaces/workspace-1/members/manager-1",
          { role: "project_manager" },
        ],
      ]),
    );
    const repository = new ProjectRepository(db);

    await expect(
      repository.delete("project-1", "manager-1"),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(db.writes).toHaveLength(0);
  });
});
