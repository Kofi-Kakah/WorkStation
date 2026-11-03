import { describe, expect, it } from "vitest";
import SavedViewsService from "./savedViews.service.js";
import SavedViewsRepository from "./savedViews.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

describe("SavedViewsService", () => {
  it("creates and lists a saved view only for its owner and workspace", async () => {
    const db = createFakeFirestore();
    const projectRepository = {
      listForWorkspace: async (workspaceId, uid) => {
        expect(workspaceId).toBe("workspace-1");
        expect(uid).toBe("member-1");
        return [];
      },
    };
    const service = new SavedViewsService(
      new SavedViewsRepository(db),
      projectRepository,
    );

    const created = await service.create("workspace-1", "member-1", {
      name: "High priority",
      filters: { priority: "high" },
    });
    const views = await service.list("workspace-1", "member-1");

    expect(created).toMatchObject({
      workspaceId: "workspace-1",
      name: "High priority",
      filters: { priority: "high" },
    });
    expect(views).toHaveLength(1);
    expect(views[0].id).toBe(created.id);
  });

  it("does not allow deleting a view from another workspace", async () => {
    const db = createFakeFirestore(
      new Map([
        ["users/member-1/savedIssueViews/view-1", {
          workspaceId: "workspace-2",
          name: "Private view",
          filters: {},
        }],
      ]),
    );
    const service = new SavedViewsService(
      new SavedViewsRepository(db),
      { listForWorkspace: async () => [] },
    );

    await expect(
      service.remove("workspace-1", "member-1", "view-1"),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(db.get("users/member-1/savedIssueViews/view-1")).toBeDefined();
  });
});
