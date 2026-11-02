import admin from "firebase-admin";
import { getFirestore } from "../../config/firebase.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";
import {
  canManageMemberRole,
  canManageWorkspace,
  ROLES,
} from "../../shared/services/permissionService.js";
import { Errors } from "../../shared/errors/index.js";

const COLLECTION = "workspaces";

export default class WorkspaceRepository {
  constructor(db = getFirestore()) {
    this.db = db;
  }

  async listForUser(uid) {
    const userSnapshot = await this.db.collection("users").doc(uid).get();
    if (!userSnapshot.exists) return [];

    const workspaceIds = userSnapshot.get("workspaceIds") || [];
    const results = await Promise.all(
      workspaceIds.map(async (workspaceId) => {
        const workspaceRef = this.db.collection(COLLECTION).doc(workspaceId);
        const [workspaceSnapshot, memberSnapshot] = await Promise.all([
          workspaceRef.get(),
          workspaceRef.collection("members").doc(uid).get(),
        ]);
        if (!workspaceSnapshot.exists || !memberSnapshot.exists) return null;
        return {
          id: workspaceSnapshot.id,
          ...workspaceSnapshot.data(),
          memberRole: memberSnapshot.get("role"),
        };
      }),
    );

    return results.filter(Boolean);
  }

  async createForUser(uid, { name, description }) {
    const workspaceId = generateId();
    const workspaceRef = this.db.collection(COLLECTION).doc(workspaceId);
    const memberRef = workspaceRef.collection("members").doc(uid);
    const userRef = this.db.collection("users").doc(uid);
    const timestamp = serverTimestamp();

    await this.db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      if (!userSnapshot.exists) {
        const error = new Error("User profile not found");
        error.code = "USER_PROFILE_NOT_FOUND";
        throw error;
      }

      transaction.create(workspaceRef, {
        name,
        description,
        slug: `${name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40)}-${workspaceId.slice(0, 6)}`,
        ownerId: uid,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      transaction.create(memberRef, {
        userId: uid,
        role: "owner",
        joinedAt: timestamp,
      });
      transaction.set(
        userRef,
        {
          workspaceIds: admin.firestore.FieldValue.arrayUnion(workspaceId),
          updatedAt: timestamp,
        },
        { merge: true },
      );
    });

    return {
      id: workspaceId,
      name,
      description,
      ownerId: uid,
      memberRole: "owner",
    };
  }

  async getForUser(workspaceId, uid) {
    const workspaceRef = this.db.collection(COLLECTION).doc(workspaceId);
    const memberRef = workspaceRef.collection("members").doc(uid);
    const result = await this.db.runTransaction(async (transaction) => {
      const [workspaceSnapshot, memberSnapshot] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(memberRef),
      ]);
      if (!workspaceSnapshot.exists || !memberSnapshot.exists) return null;
      return {
        id: workspaceSnapshot.id,
        ...workspaceSnapshot.data(),
        memberRole: memberSnapshot.get("role"),
      };
    });
    return result;
  }

  async update(workspaceId, actorUid, updates) {
    const ref = this.db.collection(COLLECTION).doc(workspaceId);
    const actorRef = ref.collection("members").doc(actorUid);
    await this.db.runTransaction(async (transaction) => {
      const [workspaceSnapshot, actorSnapshot] = await Promise.all([
        transaction.get(ref),
        transaction.get(actorRef),
      ]);
      if (!workspaceSnapshot.exists || !actorSnapshot.exists) {
        throw Errors.notFound("Workspace not found");
      }
      if (!canManageWorkspace(actorSnapshot.get("role"))) {
        throw Errors.forbidden(
          "Only workspace owners and admins can edit settings",
        );
      }
      transaction.update(ref, { ...updates, updatedAt: serverTimestamp() });
    });
    const snapshot = await ref.get();
    return { id: snapshot.id, ...snapshot.data() };
  }

  async listMembers(workspaceId, actorUid) {
    const workspaceRef = this.db.collection(COLLECTION).doc(workspaceId);
    const actorRef = workspaceRef.collection("members").doc(actorUid);
    const membersQuery = workspaceRef
      .collection("members")
      .orderBy("joinedAt", "asc");
    const memberSnapshot = await this.db.runTransaction(async (transaction) => {
      const [workspace, actor, members] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(actorRef),
        transaction.get(membersQuery),
      ]);
      if (!workspace.exists || !actor.exists) {
        throw Errors.notFound("Workspace not found");
      }
      return members;
    });

    return Promise.all(
      memberSnapshot.docs.map(async (member) => {
        const profileSnapshot = await this.db
          .collection("users")
          .doc(member.id)
          .get();
        return {
          userId: member.id,
          role: member.get("role"),
          joinedAt: member.get("joinedAt"),
          profile: profileSnapshot.exists
            ? {
                uid: profileSnapshot.id,
                email: profileSnapshot.get("email") || null,
                displayName: profileSnapshot.get("displayName") || "User",
                avatarUrl: profileSnapshot.get("avatarUrl") || null,
              }
            : null,
        };
      }),
    );
  }

  async updateMemberRole(workspaceId, actorUid, targetUid, role) {
    const workspaceRef = this.db.collection(COLLECTION).doc(workspaceId);
    const actorRef = workspaceRef.collection("members").doc(actorUid);
    const targetRef = workspaceRef.collection("members").doc(targetUid);
    await this.db.runTransaction(async (transaction) => {
      const [workspaceSnapshot, actorSnapshot, targetSnapshot] =
        await Promise.all([
          transaction.get(workspaceRef),
          transaction.get(actorRef),
          transaction.get(targetRef),
        ]);
      if (!workspaceSnapshot.exists || !actorSnapshot.exists) {
        throw Errors.notFound("Workspace not found");
      }
      if (!targetSnapshot.exists) {
        throw Errors.notFound("Workspace member not found");
      }
      if (actorUid === targetUid) {
        throw Errors.forbidden("You cannot change your own workspace role");
      }
      const actorRole = actorSnapshot.get("role");
      if (!canManageMemberRole(actorRole, targetSnapshot.get("role"))) {
        throw Errors.forbidden("You cannot manage this member's role");
      }
      if (
        role === ROLES.OWNER ||
        (actorRole === ROLES.ADMIN && role === ROLES.ADMIN)
      ) {
        throw Errors.forbidden("You cannot assign this workspace role");
      }
      transaction.update(targetRef, { role, updatedAt: serverTimestamp() });
    });
    return { userId: targetUid, role };
  }

  async removeMember(workspaceId, actorUid, targetUid) {
    const workspaceRef = this.db.collection(COLLECTION).doc(workspaceId);
    const actorRef = workspaceRef.collection("members").doc(actorUid);
    const memberRef = workspaceRef.collection("members").doc(targetUid);
    const userRef = this.db.collection("users").doc(targetUid);

    await this.db.runTransaction(async (transaction) => {
      const [workspaceSnapshot, actorSnapshot, memberSnapshot, userSnapshot] =
        await Promise.all([
          transaction.get(workspaceRef),
          transaction.get(actorRef),
          transaction.get(memberRef),
          transaction.get(userRef),
        ]);
      if (
        !workspaceSnapshot.exists ||
        !actorSnapshot.exists ||
        !memberSnapshot.exists
      ) {
        throw Errors.notFound("Workspace member not found");
      }
      const actorRole = actorSnapshot.get("role");
      const targetRole = memberSnapshot.get("role");
      if (targetRole === ROLES.OWNER) {
        throw Errors.forbidden("The workspace owner cannot be removed");
      }
      if (
        actorUid !== targetUid &&
        !canManageMemberRole(actorRole, targetRole)
      ) {
        throw Errors.forbidden("You cannot remove this workspace member");
      }

      transaction.delete(memberRef);
      if (userSnapshot.exists) {
        transaction.set(
          userRef,
          {
            workspaceIds: admin.firestore.FieldValue.arrayRemove(workspaceId),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      }
    });
  }
}
