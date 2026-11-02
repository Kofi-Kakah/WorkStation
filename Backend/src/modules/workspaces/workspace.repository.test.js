import { describe, expect, it } from "vitest";
import WorkspaceRepository from "./workspace.repository.js";

function createFirestore(documents) {
  const writes = [];

  const snapshotFor = (path) => {
    const data = documents.get(path);
    return {
      exists: data !== undefined,
      get: (field) => data?.[field],
      data: () => data,
      id: path.split("/").at(-1),
    };
  };
  const documentRef = (path) => ({
    path,
    collection: (name) => collectionRef(`${path}/${name}`),
    get: async () => snapshotFor(path),
  });
  const collectionRef = (path) => ({
    doc: (id) => documentRef(`${path}/${id}`),
  });

  return {
    writes,
    collection: collectionRef,
    async runTransaction(callback) {
      const operations = [];
      const transaction = {
        get: async (ref) => snapshotFor(ref.path),
        update: (ref, value) => operations.push(["update", ref.path, value]),
        delete: (ref) => operations.push(["delete", ref.path]),
        set: (ref, value, options) =>
          operations.push(["set", ref.path, value, options]),
        create: (ref, value) => operations.push(["create", ref.path, value]),
      };

      const result = await callback(transaction);
      for (const [operation, path, value, options] of operations) {
        writes.push({ operation, path, value, options });
        if (operation === "delete") {
          documents.delete(path);
        } else if (operation === "update" || operation === "create") {
          documents.set(path, { ...documents.get(path), ...value });
        } else if (operation === "set") {
          documents.set(
            path,
            options?.merge
              ? { ...documents.get(path), ...value }
              : { ...value },
          );
        }
      }
      return result;
    },
    get(path) {
      return documents.get(path);
    },
  };
}

describe("WorkspaceRepository authorization", () => {
  it("does not allow a member to update workspace settings", async () => {
    const db = createFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Original" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
      ]),
    );
    const repository = new WorkspaceRepository(db);

    await expect(
      repository.update("workspace-1", "member-1", { name: "Changed" }),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(db.get("workspaces/workspace-1").name).toBe("Original");
    expect(db.writes).toHaveLength(0);
  });

  it("prevents an admin from changing another admin's role", async () => {
    const db = createFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Workspace" }],
        ["workspaces/workspace-1/members/admin-1", { role: "admin" }],
        ["workspaces/workspace-1/members/admin-2", { role: "admin" }],
      ]),
    );
    const repository = new WorkspaceRepository(db);

    await expect(
      repository.updateMemberRole(
        "workspace-1",
        "admin-1",
        "admin-2",
        "member",
      ),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(db.get("workspaces/workspace-1/members/admin-2").role).toBe("admin");
    expect(db.writes).toHaveLength(0);
  });

  it("prevents an admin from granting the admin role", async () => {
    const db = createFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Workspace" }],
        ["workspaces/workspace-1/members/admin-1", { role: "admin" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
      ]),
    );
    const repository = new WorkspaceRepository(db);

    await expect(
      repository.updateMemberRole(
        "workspace-1",
        "admin-1",
        "member-1",
        "admin",
      ),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(db.get("workspaces/workspace-1/members/member-1").role).toBe(
      "member",
    );
    expect(db.writes).toHaveLength(0);
  });

  it("allows an owner to update a non-owner member role", async () => {
    const db = createFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Workspace" }],
        ["workspaces/workspace-1/members/owner-1", { role: "owner" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
      ]),
    );
    const repository = new WorkspaceRepository(db);

    await expect(
      repository.updateMemberRole(
        "workspace-1",
        "owner-1",
        "member-1",
        "project_manager",
      ),
    ).resolves.toEqual({ userId: "member-1", role: "project_manager" });

    expect(
      db.get("workspaces/workspace-1/members/member-1").role,
    ).toBe("project_manager");
  });

  it("does not allow removing the workspace owner", async () => {
    const db = createFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Workspace" }],
        ["workspaces/workspace-1/members/owner-1", { role: "owner" }],
        ["users/owner-1", { workspaceIds: ["workspace-1"] }],
      ]),
    );
    const repository = new WorkspaceRepository(db);

    await expect(
      repository.removeMember("workspace-1", "owner-1", "owner-1"),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(db.get("workspaces/workspace-1/members/owner-1")).toBeDefined();
    expect(db.writes).toHaveLength(0);
  });

  it("removes a member and updates their workspace index in one transaction", async () => {
    const db = createFirestore(
      new Map([
        ["workspaces/workspace-1", { name: "Workspace" }],
        ["workspaces/workspace-1/members/admin-1", { role: "admin" }],
        ["workspaces/workspace-1/members/member-1", { role: "member" }],
        ["users/member-1", { workspaceIds: ["workspace-1"] }],
      ]),
    );
    const repository = new WorkspaceRepository(db);

    await repository.removeMember("workspace-1", "admin-1", "member-1");

    expect(
      db.get("workspaces/workspace-1/members/member-1"),
    ).toBeUndefined();
    expect(db.writes.map(({ operation }) => operation)).toEqual([
      "delete",
      "set",
    ]);
  });
});
