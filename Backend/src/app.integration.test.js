import http from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createFakeFirestore } from "./test/fakeFirestore.js";

const state = vi.hoisted(() => ({ db: null, auth: null }));

vi.mock("./config/firebase.js", () => ({
  getFirestore: () => state.db,
  getAuth: () => state.auth,
  getStorage: () => ({
    bucket: () => ({
      file: () => ({
        save: async () => {},
        delete: async () => {},
        getSignedUrl: async () => ["https://storage.test/private"],
      }),
    }),
  }),
  getMessaging: () => ({
    sendEachForMulticast: async ({ tokens }) => ({
      failureCount: 0,
      responses: tokens.map(() => ({ success: true })),
    }),
  }),
  initializeFirebase: () => ({ firestore: state.db, auth: state.auth }),
}));

function world() {
  return new Map([
    ["workspaces/workspace-1", { name: "Alpha Workspace" }],
    ["workspaces/workspace-1/members/owner-1", { role: "owner" }],
    ["workspaces/workspace-1/members/manager-1", { role: "project_manager" }],
    ["workspaces/workspace-1/members/member-1", { role: "member" }],
    ["workspaces/workspace-1/members/member-2", { role: "member" }],
    ["workspaces/workspace-1/members/guest-1", { role: "guest" }],
    ["workspaces/workspace-1/members/bridge-1", { role: "member" }],
    ["workspaces/workspace-2", { name: "Beta Workspace" }],
    ["workspaces/workspace-2/members/owner-2", { role: "owner" }],
    ["workspaces/workspace-2/members/bridge-1", { role: "member" }],
    ["users/owner-1", { displayName: "Olivia Owner" }],
    ["users/manager-1", { displayName: "Morgan Manager" }],
    ["users/member-1", { displayName: "Jordan Member" }],
    ["users/member-2", { displayName: "Alex Member" }],
    ["users/guest-1", { displayName: "Gus Guest" }],
    ["users/bridge-1", { displayName: "Blake Bridge" }],
    [
      "projects/project-1",
      {
        workspaceId: "workspace-1",
        key: "PROJ",
        name: "Project One",
        status: "active",
        visibility: "workspace",
      },
    ],
    ["projects/project-1/members/manager-1", { role: "project_manager" }],
    ["projects/project-1/members/member-1", { role: "member" }],
    [
      "projects/project-2",
      {
        workspaceId: "workspace-2",
        key: "BETA",
        name: "Beta Project",
        status: "active",
        visibility: "workspace",
      },
    ],
    [
      "channels/channel-1",
      {
        workspaceId: "workspace-1",
        type: "channel",
        name: "general",
        visibility: "public",
        archived: false,
        lastMessageAt: null,
      },
    ],
    ["channels/channel-1/members/member-1", { userId: "member-1" }],
    ["channels/channel-1/members/member-2", { userId: "member-2" }],
    ["channels/channel-1/members/bridge-1", { userId: "bridge-1" }],
    [
      "channels/channel-2",
      {
        workspaceId: "workspace-2",
        type: "channel",
        name: "beta-general",
        visibility: "public",
        archived: false,
        lastMessageAt: null,
      },
    ],
    ["channels/channel-2/members/owner-2", { userId: "owner-2" }],
    [
      "issues/issue-1",
      {
        projectId: "project-1",
        workspaceId: "workspace-1",
        issueKey: "PROJ-1",
        title: "First task",
        status: "todo",
        priority: "medium",
        reporterId: "member-1",
        assigneeId: null,
      },
    ],
    [
      "boards/board-1",
      { projectId: "project-1", name: "Sprint board", archived: false },
    ],
    [
      "boards/board-1/lists/todo",
      { name: "To do", issueStatus: "todo", position: 1024 },
    ],
    [
      "boards/board-1/lists/done",
      { name: "Done", issueStatus: "done", position: 2048 },
    ],
  ]);
}

function bearer(uid) {
  return `Bearer test-${uid}`;
}

let app;
let server;
let port;

beforeAll(async () => {
  state.db = createFakeFirestore(world());
  state.auth = {
    verifyIdToken: vi.fn(async (token) => {
      const match = /^test-([A-Za-z0-9_-]+)$/.exec(token);
      if (!match) {
        const error = new Error("Invalid ID token");
        error.code = "auth/invalid-id-token";
        throw error;
      }
      return {
        uid: match[1],
        email: `${match[1]}@example.com`,
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }),
    getUser: async (uid) => ({
      uid,
      email: `${uid}@example.com`,
      displayName: uid,
      photoURL: null,
      emailVerified: true,
    }),
    getUserByEmail: async () => {
      const error = new Error("not found");
      error.code = "auth/user-not-found";
      throw error;
    },
    createUser: async () => ({}),
    createCustomToken: async () => "custom-token",
    generatePasswordResetLink: async () => "https://reset.test",
    confirmPasswordReset: async () => undefined,
  };

  const { createApp } = await import("./app.js");
  app = createApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = server.address().port;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  state.db.reset(world());
  state.auth.verifyIdToken.mockClear();
});

function openEventStream(uid, channelId = "channel-1") {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: `/api/v1/channels/${channelId}/events`,
        headers: { Authorization: bearer(uid) },
      },
      (res) => {
        let body = "";
        const timeout = setTimeout(
          () => reject(new Error("SSE stream did not become ready")),
          3000,
        );
        res.on("data", (chunk) => {
          body += chunk.toString();
          if (body.includes("event: ready")) {
            clearTimeout(timeout);
            resolve({ req, res, body: () => body });
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

describe("API authentication", () => {
  it("rejects missing, malformed, and invalid bearer tokens", async () => {
    const missing = await request(app).get("/api/v1/projects?workspaceId=workspace-1");
    const malformed = await request(app)
      .get("/api/v1/projects?workspaceId=workspace-1")
      .set("Authorization", "Token abc");
    const invalid = await request(app)
      .get("/api/v1/projects?workspaceId=workspace-1")
      .set("Authorization", "Bearer not-a-test-token");

    expect(missing.status).toBe(401);
    expect(malformed.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(invalid.body).toEqual({ error: "Invalid ID token" });
  });

  it("uses the verified token identity instead of client-supplied sender fields", async () => {
    const response = await request(app)
      .post("/api/v1/channels/channel-1/messages")
      .set("Authorization", bearer("member-1"))
      .send({ content: "Hello team", senderId: "owner-1", uid: "owner-1" });

    expect(response.status).toBe(201);
    expect(response.body.message).toMatchObject({
      content: "Hello team",
      senderId: "member-1",
      senderName: "Jordan Member",
    });
    expect(
      state.db.get(`channels/channel-1/messages/${response.body.message.id}`)
        .senderId,
    ).toBe("member-1");
  });

  it("reuses a verified token within the configured cache window", async () => {
    const token = "test-cache-user";
    await state.db
      .collection("workspaces")
      .doc("workspace-1")
      .collection("members")
      .doc("cache-user")
      .set({ role: "member" });

    const first = await request(app)
      .get("/api/v1/projects?workspaceId=workspace-1")
      .set("Authorization", `Bearer ${token}`);
    const second = await request(app)
      .get("/api/v1/projects?workspaceId=workspace-1")
      .set("Authorization", `Bearer ${token}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(
      state.auth.verifyIdToken.mock.calls.filter(([value]) => value === token),
    ).toHaveLength(1);
  });
});

describe("API authorization and cross-workspace isolation", () => {
  it("denies workspace access to users who are not members", async () => {
    const response = await request(app)
      .get("/api/v1/projects?workspaceId=workspace-1")
      .set("Authorization", bearer("owner-2"));

    expect(response.status).toBe(404);
  });

  it("prevents ordinary members from creating or deleting projects", async () => {
    const create = await request(app)
      .post("/api/v1/projects")
      .set("Authorization", bearer("member-1"))
      .send({
        workspaceId: "workspace-1",
        name: "Unauthorized",
        description: "",
        visibility: "workspace",
      });
    const remove = await request(app)
      .delete("/api/v1/projects/project-1")
      .set("Authorization", bearer("member-1"));

    expect(create.status).toBe(403);
    expect(remove.status).toBe(403);
    expect(state.db.get("projects/project-1").status).not.toBe("deleted");
  });

  it("blocks cross-workspace channel and issue access", async () => {
    const messages = await request(app)
      .get("/api/v1/channels/channel-2/messages")
      .set("Authorization", bearer("member-1"));
    const post = await request(app)
      .post("/api/v1/channels/channel-2/messages")
      .set("Authorization", bearer("member-1"))
      .send({ content: "Cross-workspace message" });
    const issues = await request(app)
      .get("/api/v1/issues?projectId=project-2")
      .set("Authorization", bearer("member-1"));

    expect(messages.status).toBe(404);
    expect(post.status).toBe(404);
    expect(issues.status).toBe(404);
  });

  it("denies guests access to unshared projects and issue creation", async () => {
    const list = await request(app)
      .get("/api/v1/issues?projectId=project-1")
      .set("Authorization", bearer("guest-1"));
    const create = await request(app)
      .post("/api/v1/issues")
      .set("Authorization", bearer("guest-1"))
      .send({ projectId: "project-1", title: "Guest issue" });

    expect(list.status).toBe(404);
    expect(create.status).toBe(404);
    expect(state.db.writes.some(({ path }) => path.startsWith("issues/"))).toBe(
      false,
    );
  });

  it("rejects path traversal attempts in route parameters", async () => {
    const response = await request(app)
      .get(`/api/v1/projects/${encodeURIComponent("../users/owner-1")}`)
      .set("Authorization", bearer("owner-1"));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("Chat API", () => {
  it("posts and lists channel messages", async () => {
    const created = await request(app)
      .post("/api/v1/channels/channel-1/messages")
      .set("Authorization", bearer("member-1"))
      .send({ content: "  Status update for the team  " });

    expect(created.status).toBe(201);

    const listed = await request(app)
      .get("/api/v1/channels/channel-1/messages")
      .set("Authorization", bearer("member-1"));

    expect(listed.status).toBe(200);
    expect(listed.body.messages.map(({ id }) => id)).toContain(
      created.body.message.id,
    );
    expect(listed.body.messages[0].content).toBe("Status update for the team");
  });

  it("requires channel membership before posting", async () => {
    const response = await request(app)
      .post("/api/v1/channels/channel-1/messages")
      .set("Authorization", bearer("guest-1"))
      .send({ content: "Not a member of this channel" });

    expect(response.status).toBe(404);
    expect(state.db.writes).toHaveLength(0);
  });

  it("prevents editing another member's message", async () => {
    state.db.seed("channels/channel-1/messages/message-1", {
      senderId: "member-2",
      content: "Original content",
      parentMessageId: null,
      attachmentIds: [],
      isDeleted: false,
      createdAt: new Date("2026-01-01T10:00:00.000Z"),
    });

    const response = await request(app)
      .patch("/api/v1/channels/channel-1/messages/message-1")
      .set("Authorization", bearer("member-1"))
      .send({ content: "Hijacked content" });

    expect(response.status).toBe(403);
    expect(
      state.db.get("channels/channel-1/messages/message-1").content,
    ).toBe("Original content");
  });

  it("rejects messages without content or attachments", async () => {
    const response = await request(app)
      .post("/api/v1/channels/channel-1/messages")
      .set("Authorization", bearer("member-1"))
      .send({ content: "   " });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("streams live message update notifications over SSE", async () => {
    const stream = await openEventStream("member-1");
    expect(stream.res.statusCode).toBe(200);
    expect(stream.res.headers["content-type"]).toContain("text/event-stream");
    expect(stream.body()).toContain("event: ready");
    expect(
      state.db.snapshotListeners.filter((listener) => listener.active),
    ).toHaveLength(2);
    stream.req.destroy();
  });

  it("denies SSE subscriptions to channels the user cannot access", async () => {
    const response = await request(app)
      .get("/api/v1/channels/channel-2/events")
      .set("Authorization", bearer("member-1"));

    expect(response.status).toBe(404);
  });
});

describe("Board API", () => {
  it("lets project managers create a board with default workflow lists", async () => {
    const created = await request(app)
      .post("/api/v1/boards")
      .set("Authorization", bearer("manager-1"))
      .send({ projectId: "project-1", name: "Roadmap board", description: "" });

    expect(created.status).toBe(201);

    const board = await request(app)
      .get(`/api/v1/boards/${created.body.board.id}`)
      .set("Authorization", bearer("manager-1"));

    expect(board.status).toBe(200);
    expect(board.body.board.lists).toHaveLength(5);
    expect(board.body.board.lists.map(({ issueStatus }) => issueStatus)).toEqual(
      ["backlog", "todo", "in_progress", "in_review", "done"],
    );
  });

  it("does not let ordinary members create boards", async () => {
    const response = await request(app)
      .post("/api/v1/boards")
      .set("Authorization", bearer("member-1"))
      .send({ projectId: "project-1", name: "Unauthorized board", description: "" });

    expect(response.status).toBe(403);
    expect(state.db.writes).toHaveLength(0);
  });

  it("creates one issue placement, syncs status, and rejects duplicates", async () => {
    const created = await request(app)
      .post("/api/v1/boards/board-1/cards")
      .set("Authorization", bearer("member-1"))
      .send({ issueId: "issue-1", listId: "done" });

    expect(created.status).toBe(201);
    expect(state.db.get("issues/issue-1").status).toBe("done");

    const duplicate = await request(app)
      .post("/api/v1/boards/board-1/cards")
      .set("Authorization", bearer("member-1"))
      .send({ issueId: "issue-1", listId: "todo" });

    expect(duplicate.status).toBe(409);
    expect(
      state.db
        .get(
          `boards/board-1/cards/${created.body.card.id}`,
        ),
    ).toMatchObject({ listId: "done" });
  });

  it("moves a card between lists and synchronizes the canonical issue status", async () => {
    const created = await request(app)
      .post("/api/v1/boards/board-1/cards")
      .set("Authorization", bearer("member-1"))
      .send({ issueId: "issue-1", listId: "done" });

    const moved = await request(app)
      .patch(`/api/v1/boards/board-1/cards/${created.body.card.id}/move`)
      .set("Authorization", bearer("member-1"))
      .send({ listId: "todo", position: 0 });

    expect(moved.status).toBe(200);
    expect(
      state.db.get(`boards/board-1/cards/${created.body.card.id}`).listId,
    ).toBe("todo");
    expect(state.db.get("issues/issue-1").status).toBe("todo");
  });
});

describe("Issue API", () => {
  it("creates an issue with server-derived reporter and project key", async () => {
    const created = await request(app)
      .post("/api/v1/issues")
      .set("Authorization", bearer("member-1"))
      .send({
        projectId: "project-1",
        title: "Ship onboarding",
        description: "Launch the flow",
        type: "task",
        priority: "high",
      });

    expect(created.status).toBe(201);
    expect(created.body.issue).toMatchObject({
      projectId: "project-1",
      title: "Ship onboarding",
      reporterId: "member-1",
      priority: "high",
    });
    expect(created.body.issue.issueKey).toMatch(/^PROJ-/);

    const listed = await request(app)
      .get("/api/v1/issues?projectId=project-1")
      .set("Authorization", bearer("member-2"));

    expect(listed.status).toBe(200);
    expect(listed.body.issues.map(({ id }) => id)).toContain(
      created.body.issue.id,
    );
  });

  it("updates issue status through the canonical issue endpoint", async () => {
    const response = await request(app)
      .patch("/api/v1/issues/issue-1/status")
      .set("Authorization", bearer("member-1"))
      .send({ status: "in_progress" });

    expect(response.status).toBe(200);
    expect(response.body.issue.status).toBe("in_progress");
    expect(state.db.get("issues/issue-1").status).toBe("in_progress");
  });

  it("lets project participants comment on an issue", async () => {
    const response = await request(app)
      .post("/api/v1/issues/issue-1/comments")
      .set("Authorization", bearer("member-2"))
      .send({ content: "Confirmed on my machine." });

    expect(response.status).toBe(201);
    expect(
      state.db.writes.some(
        ({ path, operation }) =>
          operation === "create" &&
          path.startsWith("issues/issue-1/comments/"),
      ),
    ).toBe(true);
  });
});

describe("Cross-module integration API", () => {
  function seedMessage() {
    state.db.seed("channels/channel-1/messages/message-1", {
      senderId: "member-1",
      content: "Login fails on Safari",
      parentMessageId: null,
      attachmentIds: [],
      isDeleted: false,
      createdAt: new Date("2026-01-02T09:00:00.000Z"),
    });
  }

  it("converts a chat message into an issue and links it back", async () => {
    seedMessage();

    const response = await request(app)
      .post("/api/v1/integrations/messages/message-1/convert-to-issue")
      .set("Authorization", bearer("member-1"))
      .send({
        channelId: "channel-1",
        projectId: "project-1",
        title: "Safari login failure",
        description: "Reported in #general",
        type: "bug",
        priority: "high",
      });

    expect(response.status).toBe(201);
    expect(response.body.alreadyConverted).toBe(false);

    const message = state.db.get("channels/channel-1/messages/message-1");
    expect(message.linkedIssueId).toBe(response.body.issue.id);
    expect(response.body.issue).toMatchObject({
      sourceChannelId: "channel-1",
      sourceMessageId: "message-1",
      reporterId: "member-1",
    });
    expect(
      state.db.writes.some(
        ({ path }) =>
          path.startsWith("workspaces/workspace-1/activities/"),
      ),
    ).toBe(true);
  });

  it("returns the existing issue for duplicate conversions", async () => {
    seedMessage();
    const payload = {
      channelId: "channel-1",
      projectId: "project-1",
      title: "Safari login failure",
    };

    const first = await request(app)
      .post("/api/v1/integrations/messages/message-1/convert-to-issue")
      .set("Authorization", bearer("member-1"))
      .send(payload);
    const second = await request(app)
      .post("/api/v1/integrations/messages/message-1/convert-to-issue")
      .set("Authorization", bearer("member-1"))
      .send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.alreadyConverted).toBe(true);
    expect(second.body.issue.id).toBe(first.body.issue.id);

    const issues = await state.db
      .collection("issues")
      .where("projectId", "==", "project-1")
      .get();
    expect(issues.docs).toHaveLength(2);
  });

  it("rejects converting a message into a project in another workspace", async () => {
    seedMessage();

    const response = await request(app)
      .post("/api/v1/integrations/messages/message-1/convert-to-issue")
      .set("Authorization", bearer("bridge-1"))
      .send({
        channelId: "channel-1",
        projectId: "project-2",
        title: "Wrong workspace",
      });

    expect(response.status).toBe(403);
    expect(state.db.get("channels/channel-1/messages/message-1").linkedIssueId)
      .toBeUndefined();
  });
});
