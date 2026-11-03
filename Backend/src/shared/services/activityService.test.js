import { describe, expect, it } from "vitest";
import ActivityService from "./activityService.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

describe("ActivityService", () => {
  it("returns workspace activity in cursor pages", async () => {
    const db = createFakeFirestore(
      new Map([
        ["workspaces/workspace-1/activities/activity-1", { action: "issue.created", createdAt: 3 }],
        ["workspaces/workspace-1/activities/activity-2", { action: "issue.status_changed", createdAt: 2 }],
        ["workspaces/workspace-1/activities/activity-3", { action: "issue.assignee_changed", createdAt: 1 }],
      ]),
    );

    const firstPage = await ActivityService.list(
      "workspace-1",
      { limit: 2 },
      db,
    );
    const secondPage = await ActivityService.list(
      "workspace-1",
      { limit: 2, cursor: firstPage.nextCursor },
      db,
    );

    expect(firstPage.items.map(({ id }) => id)).toEqual([
      "activity-1",
      "activity-2",
    ]);
    expect(firstPage).toMatchObject({ hasMore: true, nextCursor: "activity-2" });
    expect(secondPage.items.map(({ id }) => id)).toEqual(["activity-3"]);
    expect(secondPage).toMatchObject({ hasMore: false, nextCursor: null });
  });
});
