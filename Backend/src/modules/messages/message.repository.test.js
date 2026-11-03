import { describe, expect, it } from "vitest";
import MessageRepository from "./message.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

const initialChannel = (overrides = {}) =>
  new Map([
    [
      "channels/channel-1",
      {
        workspaceId: "workspace-1",
        type: "channel",
        visibility: "public",
        archived: false,
        ...overrides,
      },
    ],
    ["workspaces/workspace-1", { name: "Team" }],
    ["workspaces/workspace-1/members/member-1", { role: "member" }],
    [
      "channels/channel-1/members/member-1",
      { userId: "member-1", role: "member" },
    ],
    ["users/member-1", { displayName: "Jordan" }],
  ]);

describe("MessageRepository", () => {
  it("creates messages with server-side author identity and thread metadata", async () => {
    const db = createFakeFirestore(initialChannel());
    const repository = new MessageRepository(db);

    const message = await repository.create("channel-1", "member-1", {
      content: "Hello team",
      parentMessageId: null,
      mentions: [],
    });

    expect(message).toMatchObject({
      content: "Hello team",
      senderId: "member-1",
      senderName: "Jordan",
      parentMessageId: null,
      isDeleted: false,
    });
    expect(
      db.writes.some(
        ({ path, operation }) =>
          path === "channels/channel-1" && operation === "update",
      ),
    ).toBe(true);
  });

  it("does not allow non-members to post in a public channel", async () => {
    const documents = initialChannel();
    documents.delete("channels/channel-1/members/member-1");
    const db = createFakeFirestore(documents);
    const repository = new MessageRepository(db);

    await expect(
      repository.create("channel-1", "member-1", {
        content: "Unauthorized",
        mentions: [],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(db.writes).toHaveLength(0);
  });

  it("creates a notification for a mentioned conversation member", async () => {
    const documents = initialChannel();
    documents.set("channels/channel-1/members/member-2", {
      userId: "member-2",
    });
    documents.set("users/member-2", {
      displayName: "Alex",
      notificationPreferences: { inApp: true, push: false },
    });
    const db = createFakeFirestore(documents);
    const repository = new MessageRepository(db);

    await repository.create("channel-1", "member-1", {
      content: "Can you review this?",
      parentMessageId: null,
      mentions: ["member-2"],
    });

    const notification = db.writes.find(({ path }) =>
      path.startsWith("users/member-2/notifications/"),
    );
    expect(notification.value).toMatchObject({
      title: "You were mentioned",
      type: "mention",
      actorId: "member-1",
      resource: { type: "message", channelId: "channel-1" },
    });
  });

  it("notifies other members when a direct message is sent", async () => {
    const documents = initialChannel({
      type: "direct",
      visibility: "private",
    });
    documents.set("channels/channel-1/members/member-2", {
      userId: "member-2",
    });
    documents.set("users/member-2", {
      displayName: "Alex",
      notificationPreferences: { inApp: true, push: false },
    });
    const db = createFakeFirestore(documents);
    const repository = new MessageRepository(db);

    await repository.create("channel-1", "member-1", {
      content: "Are you available?",
      parentMessageId: null,
      mentions: [],
    });

    expect(
      db.writes.find(({ path }) =>
        path.startsWith("users/member-2/notifications/"),
      ).value,
    ).toMatchObject({
      title: "New direct message",
      type: "message",
    });
  });

  it("uses document cursors to paginate messages without skipping equal timestamps", async () => {
    const documents = initialChannel();
    const timestamp = new Date("2025-01-01T12:00:00.000Z");
    for (const id of ["message-1", "message-2", "message-3"]) {
      documents.set(`channels/channel-1/messages/${id}`, {
        senderId: "member-1",
        content: id,
        parentMessageId: null,
        createdAt: timestamp,
        attachmentIds: [],
      });
    }
    const repository = new MessageRepository(createFakeFirestore(documents));

    const firstPage = await repository.list("channel-1", "member-1", {
      limit: 2,
    });
    const secondPage = await repository.list("channel-1", "member-1", {
      limit: 2,
      before: firstPage.nextBefore,
    });

    expect(firstPage.messages).toHaveLength(2);
    expect(secondPage.messages).toHaveLength(1);
    expect(
      [...firstPage.messages, ...secondPage.messages].map(({ id }) => id),
    ).toEqual(["message-2", "message-3", "message-1"]);
  });

  it("prevents editing another member's message", async () => {
    const documents = initialChannel();
    documents.set("channels/channel-1/messages/message-1", {
      senderId: "member-2",
      content: "Original",
      isDeleted: false,
    });
    const db = createFakeFirestore(documents);
    const repository = new MessageRepository(db);

    await expect(
      repository.update("channel-1", "message-1", "member-1", {
        content: "Changed",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(db.writes).toHaveLength(0);
  });

  it("toggles reactions transactionally and updates the aggregate count", async () => {
    const documents = initialChannel();
    documents.set("channels/channel-1/messages/message-1", {
      senderId: "member-1",
      content: "Nice",
      isDeleted: false,
      reactionSummary: [],
    });
    const db = createFakeFirestore(documents);
    const repository = new MessageRepository(db);

    const added = await repository.toggleReaction(
      "channel-1",
      "message-1",
      "member-1",
      "👍",
    );
    const removed = await repository.toggleReaction(
      "channel-1",
      "message-1",
      "member-1",
      "👍",
    );

    expect(added).toMatchObject({
      reactionSummary: [{ emoji: "👍", count: 1 }],
      reacted: true,
    });
    expect(removed).toMatchObject({ reactionSummary: [], reacted: false });
  });
});
