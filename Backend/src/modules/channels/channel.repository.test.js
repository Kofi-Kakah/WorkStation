import { describe, expect, it } from "vitest";
import ChannelRepository from "./channel.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

describe("ChannelRepository", () => {
  it("creates a private channel only for verified workspace members", async () => {
    const db = createFakeFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/owner-1", { role: "owner" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
      ]),
    );
    const repository = new ChannelRepository(db);

    const channel = await repository.create("workspace-1", "owner-1", {
      name: "launch-room",
      topic: "Launch planning",
      visibility: "private",
      memberIds: ["member-1"],
    });

    expect(channel).toMatchObject({
      type: "channel",
      visibility: "private",
      currentUserIsMember: true,
    });
    expect(db.writes).toHaveLength(3);
    expect(db.writes.map(({ path }) => path)).toContain(
      `channels/${channel.id}/members/member-1`,
    );
  });

  it("does not allow adding a user outside the workspace to a channel", async () => {
    const db = createFakeFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/owner-1", { role: "owner" }],
      ]),
    );
    const repository = new ChannelRepository(db);

    await expect(
      repository.create("workspace-1", "owner-1", {
        name: "private-room",
        topic: "",
        visibility: "private",
        memberIds: ["outside-user"],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(db.writes).toHaveLength(0);
  });

  it("hides private channels from non-members and allows workspace members to join public channels", async () => {
    const db = createFakeFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
        [
          "channels/private-1",
          {
            workspaceId: "workspace-1",
            type: "channel",
            visibility: "private",
            name: "private",
            archived: false,
          },
        ],
        [
          "channels/public-1",
          {
            workspaceId: "workspace-1",
            type: "channel",
            visibility: "public",
            name: "public",
            archived: false,
          },
        ],
      ]),
    );
    const repository = new ChannelRepository(db);

    await expect(repository.getForUser("private-1", "member-1")).rejects
      .toMatchObject({ statusCode: 404 });
    const joined = await repository.join("public-1", "member-1");

    expect(joined.currentUserIsMember).toBe(true);
    expect(db.get("channels/public-1/members/member-1")).toMatchObject({
      userId: "member-1",
    });
  });

  it("reuses the same direct conversation for the same workspace members", async () => {
    const db = createFakeFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Team" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
        ["workspaces/workspace-1/members/member-2", { role: "member" }],
      ]),
    );
    const repository = new ChannelRepository(db);

    const first = await repository.createConversation("workspace-1", "member-1", {
      memberIds: ["member-2"],
    });
    const second = await repository.createConversation("workspace-1", "member-2", {
      memberIds: ["member-1"],
    });

    expect(second.id).toBe(first.id);
    expect(first.type).toBe("direct");
  });
});
