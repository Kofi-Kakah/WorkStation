import admin from "firebase-admin";
import { createHash } from "node:crypto";
import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import {
  canManageWorkspace,
} from "../../shared/services/permissionService.js";
import { serverTimestamp } from "../../shared/utils/index.js";

const COLLECTION = "invitations";
const INVITATION_TTL_DAYS = 7;

export function hashInvitationToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function isExpired(invitation) {
  return invitation.expiresAt?.toMillis?.() <= Date.now();
}

export default class InvitationRepository {
  constructor(db = getFirestore()) {
    this.db = db;
  }

  async listForWorkspace(workspaceId, actorUid) {
    const workspaceRef = this.db.collection("workspaces").doc(workspaceId);
    const actorRef = workspaceRef.collection("members").doc(actorUid);
    const invitationQuery = this.db
      .collection(COLLECTION)
      .where("workspaceId", "==", workspaceId);
    const result = await this.db.runTransaction(async (transaction) => {
      const [workspace, actor, invitations] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(actorRef),
        transaction.get(invitationQuery),
      ]);
      if (!workspace.exists || !actor.exists) {
        throw Errors.notFound("Workspace not found");
      }
      if (!canManageWorkspace(actor.get("role"))) {
        throw Errors.forbidden("Only workspace owners and admins can view invitations");
      }
      return invitations.docs;
    });

    return result
      .map((snapshot) => {
        const invitation = { ...snapshot.data() };
        delete invitation.tokenHash;
        return { id: snapshot.id, ...invitation };
      })
      .filter(
        (invitation) =>
          invitation.status === "pending" && !isExpired(invitation),
      )
      .sort((left, right) => {
        const leftTime = left.createdAt?.toMillis?.() || 0;
        const rightTime = right.createdAt?.toMillis?.() || 0;
        return rightTime - leftTime;
      });
  }

  async create(workspaceId, actorUid, { token, email, role }) {
    const tokenHash = hashInvitationToken(token);
    const invitationRef = this.db.collection(COLLECTION).doc(tokenHash);
    const workspaceRef = this.db.collection("workspaces").doc(workspaceId);
    const actorRef = workspaceRef.collection("members").doc(actorUid);
    const now = Date.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      now + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    const timestamp = serverTimestamp();

    await this.db.runTransaction(async (transaction) => {
      const [workspace, actor] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(actorRef),
      ]);
      if (!workspace.exists || !actor.exists) {
        throw Errors.notFound("Workspace not found");
      }
      if (!canManageWorkspace(actor.get("role"))) {
        throw Errors.forbidden("Only workspace owners and admins can invite members");
      }
      transaction.create(invitationRef, {
        workspaceId,
        email,
        role,
        invitedBy: actorUid,
        status: "pending",
        tokenHash,
        createdAt: timestamp,
        updatedAt: timestamp,
        expiresAt,
      });
    });
    return {
      workspaceId,
      email,
      role,
      invitedBy: actorUid,
      status: "pending",
      createdAt: timestamp,
      expiresAt,
    };
  }

  async respond(token, uid, email, action) {
    const tokenHash = hashInvitationToken(token);
    const invitationRef = this.db.collection(COLLECTION).doc(tokenHash);
    await this.db.runTransaction(async (transaction) => {
      const invitation = await transaction.get(invitationRef);
      if (!invitation.exists) throw Errors.notFound("Invitation not found");
      const invitationData = invitation.data();
      if (
        invitationData.status !== "pending" ||
        invitationData.email.toLowerCase() !== email.trim().toLowerCase()
      ) {
        throw Errors.notFound("Invitation not found");
      }
      if (isExpired(invitationData)) {
        transaction.update(invitationRef, {
          status: "expired",
          updatedAt: serverTimestamp(),
        });
        return;
      }

      const workspaceRef = this.db
        .collection("workspaces")
        .doc(invitationData.workspaceId);
      const workspaceMemberRef = workspaceRef.collection("members").doc(uid);
      const userRef = this.db.collection("users").doc(uid);
      const [workspace, existingMember, user] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(workspaceMemberRef),
        transaction.get(userRef),
      ]);
      if (!workspace.exists) throw Errors.notFound("Invitation not found");
      if (!user.exists) throw Errors.notFound("User profile not found");
      if (action === "accept" && existingMember.exists) {
        throw Errors.conflict("You are already a workspace member");
      }

      const timestamp = serverTimestamp();
      if (action === "accept") {
        transaction.create(workspaceMemberRef, {
          userId: uid,
          role: invitationData.role,
          invitedBy: invitationData.invitedBy,
          joinedAt: timestamp,
        });
        transaction.set(
          userRef,
          {
            workspaceIds: admin.firestore.FieldValue.arrayUnion(
              invitationData.workspaceId,
            ),
            updatedAt: timestamp,
          },
          { merge: true },
        );
      }
      transaction.update(invitationRef, {
        status: action === "accept" ? "accepted" : "rejected",
        respondedBy: uid,
        respondedAt: timestamp,
        updatedAt: timestamp,
      });
    });

    const snapshot = await invitationRef.get();
    const invitation = snapshot.data();
    if (invitation?.status === "expired") {
      throw Errors.conflict("This invitation has expired");
    }
    return {
      status: invitation?.status,
      workspaceId: invitation?.workspaceId,
    };
  }
}