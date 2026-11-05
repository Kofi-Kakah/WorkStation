import { describe, expect, it } from "vitest";
import IssueRepository from "./issue.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

function buildFixture(overrides = new Map()) {
  const documents = new Map([
    ["workspaces/workspace-1", { name: "Team" }],
    ["workspaces/workspace-1/members/member-1", { role: "member" }],
    ["workspaces/workspace-1/members/member-2", { role: "member" }],
    ["projects/project-1", { workspaceId: "workspace-1", key: "PROJ", status: "active", visibility: "workspace" }],
    ["projects/project-1/members/member-1", { role: "member" }],
    ["projects/project-1/members/member-2", { role: "member" }],
    ["projects/project-1/members/owner-1", { role: "project_manager" }],
  ]);
  for (const [path, value] of overrides) {
    documents.set(path, value);
  }
  return documents;
}

describe("IssueRepository", () => {
  it("creates an issue for a project member and assigns a key", async () => {
    const db = createFakeFirestore(buildFixture());
    const repository = new IssueRepository(db);

    const issue = await repository.create("project-1", "member-1", {
      projectId: "project-1",
      title: "Ship onboarding",
      description: " Launch the flow ",
      type: "task",
      status: "todo",
      priority: "high",
      labels: ["launch"],
    });

    expect(issue).toMatchObject({
      projectId: "project-1",
      title: "Ship onboarding",
      status: "todo",
      priority: "high",
    });
    expect(issue.issueKey).toMatch(/^PROJ-/);
  });

  it("rejects issue creation when the actor is not a project or workspace member", async () => {
    const db = createFakeFirestore(buildFixture());
    const repository = new IssueRepository(db);

    await expect(
      repository.create("project-1", "stranger-1", {
        projectId: "project-1",
        title: "Unauthorized issue",
        description: "",
        type: "task",
        status: "todo",
        priority: "medium",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("notifies an assignee when an issue is assigned", async () => {
    const documents = buildFixture(
      new Map([
        ["issues/issue-1", {
          projectId: "project-1",
          workspaceId: "workspace-1",
          issueKey: "PROJ-1",
          title: "Ship onboarding",
          status: "todo",
          priority: "medium",
          reporterId: "member-1",
          assigneeId: null,
        }],
        ["users/member-1", { displayName: "Jordan" }],
        [
          "users/member-2",
          {
            displayName: "Alex",
            notificationPreferences: { inApp: true, push: false },
          },
        ],
      ]),
    );
    const db = createFakeFirestore(documents);
    const repository = new IssueRepository(db);

    await repository.updateAssignee("issue-1", "member-1", "member-2");

    expect(
      db.writes.find(({ path }) =>
        path.startsWith("users/member-2/notifications/"),
      ).value,
    ).toMatchObject({
      title: "You were assigned an issue",
      resource: { type: "issue", id: "issue-1" },
      actorId: "member-1",
    });
  });

  it("moves linked board placements when an issue status changes", async () => {
    const documents = buildFixture(
      new Map([
        [
          "issues/issue-1",
          {
            projectId: "project-1",
            workspaceId: "workspace-1",
            title: "Ship onboarding",
            status: "todo",
            priority: "medium",
            reporterId: "member-1",
            assigneeId: "member-2",
          },
        ],
      ]),
    );
    for (const boardId of ["board-1", "board-2"]) {
      documents.set(`boards/${boardId}`, { projectId: "project-1" });
      documents.set(`boards/${boardId}/lists/todo`, {
        name: "To do",
        issueStatus: "todo",
        position: 1024,
      });
      documents.set(`boards/${boardId}/lists/done`, {
        name: "Done",
        issueStatus: "done",
        position: 2048,
      });
      documents.set(`boards/${boardId}/cards/card-1`, {
        issueId: "issue-1",
        listId: "todo",
        position: 1024,
      });
    }

    const db = createFakeFirestore(documents);
    const repository = new IssueRepository(db);

    await repository.update("issue-1", "member-1", { status: "done" });

    expect(db.get("issues/issue-1").status).toBe("done");
    for (const boardId of ["board-1", "board-2"]) {
      expect(db.get(`boards/${boardId}/cards/card-1`)).toMatchObject({
        issueId: "issue-1",
        listId: "done",
      });
    }
    expect(
      db.writes.filter(({ path }) =>
        path.startsWith("workspaces/workspace-1/activities/"),
      ),
    ).toHaveLength(1);
    expect(
      db.writes.filter(({ path }) =>
        path.startsWith("users/member-2/notifications/"),
      ),
    ).toHaveLength(1);
  });

  it("rejects a status change that cannot be represented on a linked board", async () => {
    const db = createFakeFirestore(
      buildFixture(
        new Map([
          [
            "issues/issue-1",
            {
              projectId: "project-1",
              status: "todo",
              reporterId: "member-1",
            },
          ],
          ["boards/board-1", { projectId: "project-1" }],
          ["boards/board-1/lists/todo", { name: "To do", issueStatus: "todo" }],
          [
            "boards/board-1/cards/card-1",
            { issueId: "issue-1", listId: "todo", position: 1024 },
          ],
        ]),
      ),
    );
    const repository = new IssueRepository(db);

    await expect(
      repository.update("issue-1", "member-1", { status: "in_review" }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(db.get("issues/issue-1").status).toBe("todo");
    expect(db.get("boards/board-1/cards/card-1").listId).toBe("todo");
    expect(db.writes).toHaveLength(0);
  });

  it("lists issue comments for authorized project members", async () => {
    const db = createFakeFirestore(
      buildFixture(
        new Map([
          ["issues/issue-1", { projectId: "project-1", title: "Alpha", status: "todo", priority: "medium", reporterId: "member-1" }],
        ]),
      ),
    );
    const repository = new IssueRepository(db);

    const comment = await repository.createComment("issue-1", "member-1", {
      content: "Need design sign-off.",
    });
    const comments = await repository.listComments("issue-1", "member-1");

    expect(comment).toMatchObject({ issueId: "issue-1", content: "Need design sign-off." });
    expect(comments).toHaveLength(1);
  });

  it("notifies the other issue participant when a comment is added", async () => {
    const documents = buildFixture(
      new Map([
        [
          "issues/issue-1",
          {
            projectId: "project-1",
            workspaceId: "workspace-1",
            issueKey: "PROJ-1",
            title: "Ship onboarding",
            status: "todo",
            priority: "medium",
            reporterId: "member-1",
            assigneeId: "member-2",
          },
        ],
        ["users/member-1", { displayName: "Jordan" }],
        [
          "users/member-2",
          {
            displayName: "Alex",
            notificationPreferences: { inApp: true, push: false },
          },
        ],
      ]),
    );
    const db = createFakeFirestore(documents);
    const repository = new IssueRepository(db);

    await repository.createComment("issue-1", "member-1", {
      content: "Please review the new implementation.",
    });

    expect(
      db.writes.find(({ path }) =>
        path.startsWith("users/member-2/notifications/"),
      ).value,
    ).toMatchObject({
      title: "New comment on an issue",
      resource: { type: "issue", id: "issue-1" },
      actorId: "member-1",
    });
  });

  it("hides a restricted project's issues from workspace members without project membership", async () => {
    const db = createFakeFirestore(
      buildFixture(
        new Map([
          ["workspaces/workspace-1/members/member-3", { role: "member" }],
          [
            "projects/project-1",
            {
              workspaceId: "workspace-1",
              key: "PROJ",
              status: "active",
              visibility: "restricted",
            },
          ],
          [
            "issues/issue-1",
            { projectId: "project-1", title: "Confidential", status: "todo" },
          ],
        ]),
      ),
    );
    const repository = new IssueRepository(db);

    await expect(
      repository.list("project-1", "member-3"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("shows a restricted project's issues to its explicit project members", async () => {
    const db = createFakeFirestore(
      buildFixture(
        new Map([
          [
            "projects/project-1",
            {
              workspaceId: "workspace-1",
              key: "PROJ",
              status: "active",
              visibility: "restricted",
            },
          ],
          [
            "issues/issue-1",
            { projectId: "project-1", title: "Confidential", status: "todo" },
          ],
        ]),
      ),
    );
    const repository = new IssueRepository(db);

    await expect(repository.list("project-1", "member-2")).resolves.toEqual([
      expect.objectContaining({ id: "issue-1", title: "Confidential" }),
    ]);
  });

  it("lets any project participant comment on an issue", async () => {
    const db = createFakeFirestore(
      buildFixture(
        new Map([
          [
            "issues/issue-1",
            {
              projectId: "project-1",
              title: "Alpha",
              status: "todo",
              reporterId: "member-2",
              assigneeId: null,
            },
          ],
        ]),
      ),
    );
    const repository = new IssueRepository(db);

    await expect(
      repository.createComment("issue-1", "member-1", {
        content: "Adding context from the design review.",
      }),
    ).resolves.toMatchObject({ issueId: "issue-1" });
  });

  it("denies guests without project membership from creating issues", async () => {
    const db = createFakeFirestore(
      buildFixture(
        new Map([
          ["workspaces/workspace-1/members/guest-1", { role: "guest" }],
        ]),
      ),
    );
    const repository = new IssueRepository(db);

    await expect(
      repository.create("project-1", "guest-1", {
        projectId: "project-1",
        title: "Guest issue",
        description: "",
        type: "task",
        status: "todo",
        priority: "medium",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(db.writes).toHaveLength(0);
  });

  it("filters issues by assignee, due-date window, and sprint", async () => {
    const db = createFakeFirestore(
      buildFixture(
        new Map([
          [
            "issues/issue-1",
            {
              projectId: "project-1",
              title: "Current sprint",
              status: "todo",
              assigneeId: "member-2",
              dueDate: "2026-11-12",
              sprintId: "sprint-1",
            },
          ],
          [
            "issues/issue-2",
            {
              projectId: "project-1",
              title: "Later work",
              status: "todo",
              assigneeId: "member-2",
              dueDate: "2026-12-01",
              sprintId: "sprint-2",
            },
          ],
          [
            "issues/issue-3",
            {
              projectId: "project-1",
              title: "Unassigned",
              status: "todo",
              assigneeId: null,
              dueDate: "2026-11-12",
              sprintId: "sprint-1",
            },
          ],
        ]),
      ),
    );
    const repository = new IssueRepository(db);

    const issues = await repository.list("project-1", "member-1", {
      assigneeId: "member-2",
      dueDateFrom: "2026-11-01",
      dueDateTo: "2026-11-30",
      sprintId: "sprint-1",
    });

    expect(issues.map((issue) => issue.id)).toEqual(["issue-1"]);
  });
});
