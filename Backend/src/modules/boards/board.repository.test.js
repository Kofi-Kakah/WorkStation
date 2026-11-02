import { describe, expect, it } from "vitest";
import BoardRepository from "./board.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

const fixture = (role = "owner") =>
  new Map([
    [
      "projects/project-1",
      {
        workspaceId: "workspace-1",
        visibility: "workspace",
        status: "active",
      },
    ],
    ["workspaces/workspace-1/members/member-1", { role }],
    ["projects/project-1/members/member-1", { role: "project_manager" }],
    ["boards/board-1", { projectId: "project-1", name: "Sprint board" }],
    [
      "boards/board-1/lists/todo",
      { name: "To do", position: 1024 },
    ],
    [
      "boards/board-1/lists/done",
      { name: "Done", position: 2048 },
    ],
    [
      "issues/issue-1",
      {
        projectId: "project-1",
        title: "First task",
        status: "To do",
        priority: "medium",
      },
    ],
    [
      "issues/issue-2",
      {
        projectId: "project-1",
        title: "Second task",
        status: "To do",
        priority: "high",
      },
    ],
  ]);

describe("BoardRepository", () => {
  it("creates a board and its default lists for a project manager", async () => {
    const db = createFakeFirestore(fixture());
    const repository = new BoardRepository(db);

    const board = await repository.create("project-1", "member-1", {
      name: "Roadmap",
      description: "",
    });

    expect(board).toMatchObject({
      projectId: "project-1",
      name: "Roadmap",
      archived: false,
    });
    expect(
      [...db.writes.map(({ path }) => path)].filter((path) =>
        path.startsWith(`boards/${board.id}/lists/`),
      ),
    ).toHaveLength(3);
  });

  it("does not allow a project member to create a board", async () => {
    const documents = fixture("member");
    documents.set("projects/project-1/members/member-1", { role: "member" });
    const db = createFakeFirestore(documents);
    const repository = new BoardRepository(db);

    await expect(
      repository.create("project-1", "member-1", {
        name: "Roadmap",
        description: "",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(db.writes).toHaveLength(0);
  });

  it("creates one placement per existing issue and rejects duplicate placements", async () => {
    const db = createFakeFirestore(fixture());
    const repository = new BoardRepository(db);
    const card = await repository.createCard("board-1", "member-1", {
      issueId: "issue-1",
      listId: "todo",
    });

    expect(card).toMatchObject({
      issueId: "issue-1",
      listId: "todo",
      position: 1024,
    });
    await expect(
      repository.createCard("board-1", "member-1", {
        issueId: "issue-1",
        listId: "done",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(db.writes.filter(({ operation }) => operation === "create")).toHaveLength(1);
  });

  it("rejects placing an issue from another project", async () => {
    const documents = fixture();
    documents.set("issues/foreign-issue", {
      projectId: "another-project",
      title: "Private task",
    });
    const db = createFakeFirestore(documents);
    const repository = new BoardRepository(db);

    await expect(
      repository.createCard("board-1", "member-1", {
        issueId: "foreign-issue",
        listId: "todo",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(db.writes).toHaveLength(0);
  });

  it("moves an issue placement between lists and persists its new rank", async () => {
    const documents = fixture();
    documents.set("boards/board-1/cards/card-1", {
      issueId: "issue-1",
      listId: "todo",
      position: 1024,
    });
    const db = createFakeFirestore(documents);
    const repository = new BoardRepository(db);

    await repository.moveCard("board-1", "card-1", "member-1", {
      listId: "done",
      position: 0,
    });

    expect(db.get("boards/board-1/cards/card-1")).toMatchObject({
      listId: "done",
      position: 1024,
    });
  });

  it("reorders cards within a list without fractional position ranks", async () => {
    const documents = fixture();
    documents.set("boards/board-1/cards/card-1", {
      issueId: "issue-1",
      listId: "todo",
      position: 1024,
    });
    documents.set("boards/board-1/cards/card-2", {
      issueId: "issue-2",
      listId: "todo",
      position: 2048,
    });
    const db = createFakeFirestore(documents);
    const repository = new BoardRepository(db);

    await repository.moveCard("board-1", "card-1", "member-1", {
      listId: "todo",
      position: 1,
    });

    expect(db.get("boards/board-1/cards/card-2").position).toBeLessThan(
      db.get("boards/board-1/cards/card-1").position,
    );
    expect(Number.isInteger(db.get("boards/board-1/cards/card-1").position)).toBe(true);
  });

  it("does not delete a list while it still contains cards", async () => {
    const documents = fixture();
    documents.set("boards/board-1/cards/card-1", {
      issueId: "issue-1",
      listId: "todo",
      position: 1024,
    });
    const db = createFakeFirestore(documents);
    const repository = new BoardRepository(db);

    await expect(
      repository.deleteList("board-1", "todo", "member-1"),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(db.get("boards/board-1/lists/todo")).toBeTruthy();
  });
});
