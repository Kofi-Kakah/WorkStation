import { describe, expect, it } from "vitest";
import NotificationService from "./notificationService.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

describe("NotificationService", () => {
  it("creates idempotent notifications and returns cursor pages", async () => {
    const db = createFakeFirestore(
      new Map([
        ["users/member-1", { notificationPreferences: { inApp: true, push: false } }],
      ]),
    );

    const first = await NotificationService.create({
      userId: "member-1",
      title: "Assigned",
      body: "A task was assigned to you",
      dedupeKey: "issue-assigned-1",
      db,
    });
    const repeated = await NotificationService.create({
      userId: "member-1",
      title: "Assigned",
      body: "A task was assigned to you",
      dedupeKey: "issue-assigned-1",
      db,
    });

    expect(first).toMatchObject({ created: true, id: expect.any(String) });
    expect(repeated).toMatchObject({ deduplicated: true, id: first.id });
    expect(
      db.writes.filter(({ path }) => path.startsWith("users/member-1/notifications/")),
    ).toHaveLength(1);
  });

  it("honors in-app and push preferences", async () => {
    const db = createFakeFirestore(
      new Map([
        [
          "users/member-1",
          { notificationPreferences: { inApp: false, push: false } },
        ],
      ]),
    );

    const result = await NotificationService.create({
      userId: "member-1",
      title: "Hidden",
      db,
    });

    expect(result).toMatchObject({ suppressed: true, id: null });
    expect(db.writes).toHaveLength(0);
  });

  it("paginates notifications and maintains unread counts", async () => {
    const db = createFakeFirestore(
      new Map([
        ["users/member-1/notifications/notice-1", { title: "First", read: false, createdAt: 3 }],
        ["users/member-1/notifications/notice-2", { title: "Second", read: true, createdAt: 2 }],
        ["users/member-1/notifications/notice-3", { title: "Third", read: false, createdAt: 1 }],
      ]),
    );

    const firstPage = await NotificationService.list(
      "member-1",
      { limit: 2 },
      db,
    );
    const secondPage = await NotificationService.list(
      "member-1",
      { limit: 2, cursor: firstPage.nextCursor },
      db,
    );

    expect(firstPage.items.map(({ id }) => id)).toEqual([
      "notice-1",
      "notice-2",
    ]);
    expect(firstPage).toMatchObject({
      unreadCount: 2,
      hasMore: true,
      nextCursor: "notice-2",
    });
    expect(secondPage.items.map(({ id }) => id)).toEqual(["notice-3"]);
    expect(secondPage).toMatchObject({
      unreadCount: 2,
      hasMore: false,
      nextCursor: null,
    });
  });

  it("marks one or all notifications read without exposing another user's records", async () => {
    const db = createFakeFirestore(
      new Map([
        ["users/member-1/notifications/notice-1", { read: false }],
        ["users/member-1/notifications/notice-2", { read: false }],
        ["users/member-2/notifications/notice-3", { read: false }],
      ]),
    );

    await NotificationService.markRead("member-1", "notice-1", db);
    const result = await NotificationService.markAllRead("member-1", db);

    expect(result).toEqual({ count: 1 });
    expect(db.get("users/member-1/notifications/notice-1").read).toBe(true);
    expect(db.get("users/member-1/notifications/notice-2").read).toBe(true);
    expect(db.get("users/member-2/notifications/notice-3").read).toBe(false);
  });

  it("stores device tokens under non-reversible document identifiers", async () => {
    const db = createFakeFirestore(
      new Map([
        ["users/member-1", { notificationPreferences: { push: true } }],
      ]),
    );
    const token = "browser-registration-token";

    expect(
      await NotificationService.registerDevice(
        "member-1",
        { token, userAgent: "test-browser" },
        db,
      ),
    ).toEqual({ registered: true });
    expect(db.writes[0].path).not.toContain(token);
    expect(db.writes[0].value.token).toBe(token);
    expect(
      await NotificationService.removeDevice("member-1", token, db),
    ).toEqual({ removed: true });
  });
});
