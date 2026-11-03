import { describe, expect, it } from "vitest";
import SearchService from "./search.service.js";

describe("SearchService", () => {
  it("searches only projects visible to the authenticated workspace member", async () => {
    const service = new SearchService(
      {
        listForWorkspace: async (workspaceId, uid) => {
          expect(workspaceId).toBe("workspace-1");
          expect(uid).toBe("member-1");
          return [{ id: "project-1", name: "Release", description: "Launch plan" }];
        },
      },
      {
        list: async (projectId, uid, filters) => {
          expect(projectId).toBe("project-1");
          expect(uid).toBe("member-1");
          expect(filters.search).toBe("launch");
          return [{
            id: "issue-1",
            title: "Launch checklist",
            issueKey: "REL-1",
            status: "todo",
          }];
        },
      },
      {
        listForWorkspace: async () => [{
          id: "channel-1",
          name: "launch-room",
          topic: "Launch discussion",
        }],
        listConversations: async () => [],
      },
      {
        searchRecent: async (channelId, uid, query, limit) => {
          expect(channelId).toBe("channel-1");
          expect(uid).toBe("member-1");
          expect(query).toBe("launch");
          expect(limit).toBe(3);
          return {
            messages: [{
              id: "message-1",
              content: "Launch checklist is ready",
              senderName: "Jordan",
            }],
            limited: false,
          };
        },
      },
    );

    await expect(service.search("workspace-1", "member-1", "launch")).resolves.toEqual({
      results: [
        {
          type: "project",
          id: "project-1",
          title: "Release",
          subtitle: "Launch plan",
          href: "/projects/project-1",
        },
        {
          type: "issue",
          id: "issue-1",
          title: "Launch checklist",
          subtitle: "REL-1 · todo",
          href: "/issues/issue-1",
        },
        {
          type: "channel",
          id: "channel-1",
          title: "#launch-room",
          subtitle: "Launch discussion",
          href: "/channels?channelId=channel-1",
        },
        {
          type: "message",
          id: "channel-1:message-1",
          title: "Launch checklist is ready",
          subtitle: "launch-room · Jordan",
          href: "/channels?channelId=channel-1&messageId=message-1",
        },
      ],
      limited: false,
    });

  });

  it("reports when a conversation search reached its recent-history scan limit", async () => {
    const service = new SearchService(
      { listForWorkspace: async () => [] },
      { list: async () => [] },
      {
        listForWorkspace: async () => [],
        listConversations: async () => [
          { id: "dm-1", lastMessageAt: "2026-10-01" },
        ],
      },
      {
        searchRecent: async () => ({ messages: [], limited: true }),
      },
    );

    await expect(
      service.search("workspace-1", "member-1", "launch"),
    ).resolves.toEqual({
      results: [],
      limited: true,
    });
  });
});
