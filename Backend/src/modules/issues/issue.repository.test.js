import { describe, expect, it } from "vitest";
import IssueRepository from "./issue.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

function buildFixture(overrides = new Map()) {
  const documents = new Map([
    ["workspaces/workspace-1", { name: "Team" }],
    ["workspaces/workspace-1/members/member-1", { role: "member" }],
    ["projects/project-1", { workspaceId: "workspace-1", key: "PROJ", status: "active", visibility: "workspace" }],
    ["projects/project-1/members/member-1", { role: "member" }],
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
});
