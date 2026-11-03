import { describe, expect, it } from "vitest";
import IntegrationRepository from "./integration.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

function buildFixture(overrides = new Map()) {
  const documents = new Map([
    [
      "channels/channel-1",
      {
        workspaceId: "workspace-1",
        type: "channel",
        visibility: "private",
        archived: false,
      },
    ],
    [
      "channels/channel-1/messages/message-1",
      {
        content: "Investigate the failed deployment",
        senderId: "member-1",
        isDeleted: false,
      },
    ],
    ["channels/channel-1/members/member-1", { userId: "member-1" }],
    ["workspaces/workspace-1", { name: "Team" }],
    ["workspaces/workspace-1/members/member-1", { role: "member" }],
    ["workspaces/workspace-1/members/member-2", { role: "member" }],
    [
      "projects/project-1",
      { workspaceId: "workspace-1", key: "PROJ", status: "active" },
    ],
    ["projects/project-1/members/member-1", { role: "member" }],
    ["projects/project-1/members/member-2", { role: "member" }],
  ]);
  for (const [path, value] of overrides) {
    documents.set(path, value);
  }
  return documents;
}

const conversionInput = {
  channelId: "channel-1",
  messageId: "message-1",
  projectId: "project-1",
  title: "Investigate failed deployment",
  description: "Investigate the failed deployment",
  type: "bug",
  priority: "high",
  assigneeId: "member-2",
};

describe("IntegrationRepository", () => {
  it("converts an accessible message to one linked issue", async () => {
    const db = createFakeFirestore(buildFixture());
    const repository = new IntegrationRepository(db);

    const result = await repository.convertMessageToIssue(
      "member-1",
      conversionInput,
    );

    expect(result.alreadyConverted).toBe(false);
    expect(result.issue).toMatchObject({
      projectId: "project-1",
      sourceChannelId: "channel-1",
      sourceMessageId: "message-1",
      sourceConversationType: "channel",
      title: conversionInput.title,
      type: "bug",
      priority: "high",
    });
    expect(db.get("channels/channel-1/messages/message-1")).toMatchObject({
      linkedIssueId: result.issue.id,
      linkedIssueKey: result.issue.issueKey,
    });
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

  it("returns the existing issue when conversion is repeated", async () => {
    const db = createFakeFirestore(buildFixture());
    const repository = new IntegrationRepository(db);

    const created = await repository.convertMessageToIssue(
      "member-1",
      conversionInput,
    );
    const repeated = await repository.convertMessageToIssue(
      "member-1",
      conversionInput,
    );

    expect(repeated).toMatchObject({
      alreadyConverted: true,
      issue: { id: created.issue.id },
    });
    expect(
      db.writes.filter(
        ({ path, operation }) =>
          path.startsWith("issues/") && operation === "create",
      ),
    ).toHaveLength(1);
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

  it("does not convert messages from a private channel without membership", async () => {
    const documents = buildFixture();
    documents.delete("channels/channel-1/members/member-1");
    const db = createFakeFirestore(documents);
    const repository = new IntegrationRepository(db);

    await expect(
      repository.convertMessageToIssue("member-1", conversionInput),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(db.writes).toHaveLength(0);
  });

  it("rejects projects in another workspace without writing either record", async () => {
    const documents = buildFixture();
    documents.set("projects/project-1", {
      workspaceId: "workspace-2",
      key: "OTHER",
      status: "active",
    });
    documents.set("workspaces/workspace-2", { name: "Other" });
    documents.set("workspaces/workspace-2/members/member-1", {
      role: "member",
    });
    const db = createFakeFirestore(documents);
    const repository = new IntegrationRepository(db);

    await expect(
      repository.convertMessageToIssue("member-1", conversionInput),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(db.writes).toHaveLength(0);
  });
});
