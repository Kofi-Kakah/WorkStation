import { describe, expect, it } from "vitest";
import InvitationRepository, {
  hashInvitationToken,
} from "./invitation.repository.js";
import { createFakeFirestore } from "../../test/fakeFirestore.js";

function invitationFixture({ email = "invitee@example.com", expiresAt } = {}) {
  const token = "a".repeat(43);
  const tokenHash = hashInvitationToken(token);
  return {
    token,
    tokenHash,
    documents: new Map([
      [
        `invitations/${tokenHash}`,
        {
          workspaceId: "workspace-1",
          email,
          role: "member",
          invitedBy: "owner-1",
          tokenHash,
          status: "pending",
          expiresAt: expiresAt || { toMillis: () => Date.now() + 60_000 },
        },
      ],
      ["workspaces/workspace-1", { name: "Team" }],
      ["users/invitee-1", { workspaceIds: [] }],
    ]),
  };
}

describe("InvitationRepository", () => {
  it("stores tokens by hash and only accepts the invited email", async () => {
    const fixture = invitationFixture();
    const db = createFakeFirestore(fixture.documents);
    const repository = new InvitationRepository(db);

    await expect(
      repository.respond(
        fixture.token,
        "invitee-1",
        "another@example.com",
        "accept",
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(db.writes).toHaveLength(0);
  });

  it("accepts an invitation with atomic membership and user-index writes", async () => {
    const fixture = invitationFixture();
    const db = createFakeFirestore(fixture.documents);
    const repository = new InvitationRepository(db);

    await expect(
      repository.respond(
        fixture.token,
        "invitee-1",
        "INVITEE@example.com",
        "accept",
      ),
    ).resolves.toEqual({
      status: "accepted",
      workspaceId: "workspace-1",
    });
    expect(db.writes.map(({ operation }) => operation)).toEqual([
      "create",
      "set",
      "update",
    ]);
    expect(
      db.get("workspaces/workspace-1/members/invitee-1"),
    ).toMatchObject({ role: "member", userId: "invitee-1" });
    expect(
      db.get(`invitations/${fixture.tokenHash}`).status,
    ).toBe("accepted");
  });

  it("rejects expired invitations without adding a workspace member", async () => {
    const fixture = invitationFixture({
      expiresAt: { toMillis: () => Date.now() - 1 },
    });
    const db = createFakeFirestore(fixture.documents);
    const repository = new InvitationRepository(db);

    await expect(
      repository.respond(
        fixture.token,
        "invitee-1",
        "invitee@example.com",
        "accept",
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(
      db.get("workspaces/workspace-1/members/invitee-1"),
    ).toBeUndefined();
    expect(db.get(`invitations/${fixture.tokenHash}`).status).toBe("expired");
  });

  it("never returns token hashes when listing pending invitations", async () => {
    const fixture = invitationFixture();
    fixture.documents.set(
      "workspaces/workspace-1/members/admin-1",
      { role: "admin" },
    );
    const db = createFakeFirestore(fixture.documents);
    const repository = new InvitationRepository(db);

    const invitations = await repository.listForWorkspace(
      "workspace-1",
      "admin-1",
    );

    expect(invitations).toHaveLength(1);
    expect(invitations[0]).not.toHaveProperty("tokenHash");
    expect(invitations[0].id).toBe(fixture.tokenHash);
  });
});
