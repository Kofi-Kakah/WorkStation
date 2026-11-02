import { createHash } from "node:crypto";
import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";
import { canManageWorkspace } from "../../shared/services/permissionService.js";

const COLLECTION = "channels";

function channelFromSnapshot(snapshot, membership) {
  const channel = { id: snapshot.id, ...snapshot.data() };
  channel.currentUserIsMember = Boolean(membership);
  if (membership) channel.currentUserLastReadAt = membership.lastReadAt || null;
  return channel;
}

export default class ChannelRepository {
  constructor(db = getFirestore()) {
    this.db = db;
  }

  async _workspaceMember(workspaceId, uid) {
    const workspaceRef = this.db.collection("workspaces").doc(workspaceId);
    const [workspace, membership] = await Promise.all([
      workspaceRef.get(),
      workspaceRef.collection("members").doc(uid).get(),
    ]);
    if (!workspace.exists || !membership.exists) {
      throw Errors.notFound("Workspace not found");
    }
    return { workspace, membership };
  }

  async _channelAccess(channelId, uid, { requireMembership = false } = {}) {
    const channelRef = this.db.collection(COLLECTION).doc(channelId);
    const channel = await channelRef.get();
    if (!channel.exists || channel.get("archived")) {
      throw Errors.notFound("Channel not found");
    }
    const workspaceRef = this.db
      .collection("workspaces")
      .doc(channel.get("workspaceId"));
    const [workspaceMembership, channelMembership] = await Promise.all([
      workspaceRef.collection("members").doc(uid).get(),
      channelRef.collection("members").doc(uid).get(),
    ]);
    if (!workspaceMembership.exists) {
      throw Errors.notFound("Channel not found");
    }
    if (
      (channel.get("visibility") === "private" || requireMembership) &&
      !channelMembership.exists
    ) {
      throw Errors.notFound("Channel not found");
    }
    return {
      channelRef,
      channel,
      workspaceMembership,
      channelMembership: channelMembership.exists ? channelMembership : null,
    };
  }

  async listForWorkspace(workspaceId, uid) {
    await this._workspaceMember(workspaceId, uid);
    const result = await this.db
      .collection(COLLECTION)
      .where("workspaceId", "==", workspaceId)
      .get();
    const channels = await Promise.all(
      result.docs
        .filter(
          (snapshot) =>
            snapshot.get("type") === "channel" && !snapshot.get("archived"),
        )
        .map(async (snapshot) => {
          const membership = await snapshot.ref
            .collection("members")
            .doc(uid)
            .get();
          if (snapshot.get("visibility") === "private" && !membership.exists) {
            return null;
          }
          return channelFromSnapshot(
            snapshot,
            membership.exists ? membership.data() : null,
          );
        }),
    );
    return channels
      .filter(Boolean)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async create(workspaceId, actorUid, input) {
    const memberIds = [...new Set([actorUid, ...input.memberIds])];
    const workspaceRef = this.db.collection("workspaces").doc(workspaceId);
    const workspaceMemberRefs = memberIds.map((memberId) =>
      workspaceRef
        .collection("members")
        .doc(memberId),
    );
    const channelId = generateId();
    const channelRef = this.db.collection(COLLECTION).doc(channelId);
    const timestamp = serverTimestamp();
    const channel = {
      workspaceId,
      type: "channel",
      name: input.name,
      topic: input.topic,
      visibility: input.visibility,
      archived: false,
      createdBy: actorUid,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessageAt: null,
    };

    await this.db.runTransaction(async (transaction) => {
      const [workspace, ...memberSnapshots] = await Promise.all([
        transaction.get(workspaceRef),
        ...workspaceMemberRefs.map((memberRef) => transaction.get(memberRef)),
      ]);
      if (!workspace.exists || memberSnapshots.some((snapshot) => !snapshot.exists)) {
        throw Errors.notFound("Workspace member not found");
      }
      transaction.create(channelRef, channel);
      memberIds.forEach((memberId) => {
        transaction.create(channelRef.collection("members").doc(memberId), {
          userId: memberId,
          joinedAt: timestamp,
          lastReadAt: memberId === actorUid ? timestamp : null,
        });
      });
    });

    return { id: channelId, ...channel, currentUserIsMember: true };
  }

  async join(channelId, uid) {
    const channelRef = this.db.collection(COLLECTION).doc(channelId);
    const memberRef = channelRef.collection("members").doc(uid);
    await this.db.runTransaction(async (transaction) => {
      const channel = await transaction.get(channelRef);
      if (!channel.exists || channel.get("archived")) {
        throw Errors.notFound("Channel not found");
      }
      const workspaceRef = this.db
        .collection("workspaces")
        .doc(channel.get("workspaceId"));
      const [workspaceMember, channelMember] = await Promise.all([
        transaction.get(workspaceRef.collection("members").doc(uid)),
        transaction.get(memberRef),
      ]);
      if (!workspaceMember.exists) {
        throw Errors.notFound("Channel not found");
      }
      if (channel.get("type") !== "channel") {
        throw Errors.validation("Only channels can be joined");
      }
      if (channel.get("visibility") === "private") {
        throw Errors.forbidden("Private channels require an invitation");
      }
      if (!channelMember.exists) {
        transaction.create(memberRef, {
          userId: uid,
          joinedAt: serverTimestamp(),
          lastReadAt: null,
        });
      }
    });
    return this.getForUser(channelId, uid);
  }

  async getForUser(channelId, uid) {
    const { channel, channelMembership } = await this._channelAccess(
      channelId,
      uid,
    );
    return channelFromSnapshot(channel, channelMembership?.data());
  }

  getAccess(channelId, uid, options) {
    return this._channelAccess(channelId, uid, options);
  }

  async listConversations(workspaceId, uid) {
    await this._workspaceMember(workspaceId, uid);
    const result = await this.db
      .collection(COLLECTION)
      .where("workspaceId", "==", workspaceId)
      .get();
    const conversations = await Promise.all(
      result.docs
        .filter(
          (snapshot) =>
            ["direct", "group"].includes(snapshot.get("type")) &&
            !snapshot.get("archived"),
        )
        .map(async (snapshot) => {
          const members = await snapshot.ref.collection("members").get();
          if (!members.docs.some((member) => member.id === uid)) return null;
          const memberProfiles = await Promise.all(
            members.docs.map(async (member) => {
              const profile = await this.db
                .collection("users")
                .doc(member.id)
                .get();
              return {
                userId: member.id,
                displayName: profile.get("displayName") || "Workspace member",
                avatarUrl: profile.get("avatarUrl") || null,
                lastReadAt: member.get("lastReadAt") || null,
                lastSeenAt: member.get("lastSeenAt") || null,
              };
            }),
          );
          return {
            ...channelFromSnapshot(snapshot, { joinedAt: null }),
            members: memberProfiles,
          };
        }),
    );
    return conversations
      .filter(Boolean)
      .sort((left, right) => {
        const leftTime = left.lastMessageAt?.toMillis?.() || 0;
        const rightTime = right.lastMessageAt?.toMillis?.() || 0;
        return rightTime - leftTime;
      });
  }

  async createConversation(workspaceId, actorUid, input) {
    const memberIds = [...new Set([actorUid, ...input.memberIds])].sort();
    if (memberIds.length < 2) {
      throw Errors.validation("Select at least one other workspace member");
    }
    const digest = createHash("sha256")
      .update(`${workspaceId}:${JSON.stringify(memberIds)}`)
      .digest("hex")
      .slice(0, 40);
    const conversationId = `dm_${digest}`;
    const conversationRef = this.db.collection(COLLECTION).doc(conversationId);
    const workspaceRef = this.db.collection("workspaces").doc(workspaceId);
    const memberRefs = memberIds.map((memberId) =>
      workspaceRef.collection("members").doc(memberId),
    );
    const timestamp = serverTimestamp();
    const data = {
      workspaceId,
      type: memberIds.length === 2 ? "direct" : "group",
      visibility: "private",
      name: input.name?.trim() || null,
      archived: false,
      createdBy: actorUid,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessageAt: null,
    };
    await this.db.runTransaction(async (transaction) => {
      const [workspace, existing, ...memberships] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(conversationRef),
        ...memberRefs.map((memberRef) => transaction.get(memberRef)),
      ]);
      if (!workspace.exists || memberships.some((member) => !member.exists)) {
        throw Errors.notFound("Workspace member not found");
      }
      if (existing.exists) return;
      transaction.create(conversationRef, data);
      memberIds.forEach((memberId) => {
        transaction.create(conversationRef.collection("members").doc(memberId), {
          userId: memberId,
          joinedAt: timestamp,
          lastReadAt: memberId === actorUid ? timestamp : null,
        });
      });
    });
    const conversation = await this.getForUser(conversationId, actorUid);
    const memberDocs = await conversationRef.collection("members").get();
    const memberProfiles = await Promise.all(
      memberDocs.docs.map(async (member) => {
        const profile = await this.db.collection("users").doc(member.id).get();
        return {
          userId: member.id,
          displayName: profile.get("displayName") || "Workspace member",
          avatarUrl: profile.get("avatarUrl") || null,
        };
      }),
    );
    return { ...conversation, members: memberProfiles };
  }

  async addMember(channelId, actorUid, targetUid) {
    const { channelRef, channel, workspaceMembership } =
      await this._channelAccess(channelId, actorUid, { requireMembership: true });
    if (channel.get("type") !== "channel") {
      throw Errors.validation("Conversation membership cannot be changed here");
    }
    const canManage =
      channel.get("createdBy") === actorUid ||
      canManageWorkspace(workspaceMembership.get("role"));
    if (!canManage) throw Errors.forbidden("You cannot manage channel members");
    const targetMember = await this.db
      .collection("workspaces")
      .doc(channel.get("workspaceId"))
      .collection("members")
      .doc(targetUid)
      .get();
    if (!targetMember.exists) {
      throw Errors.validation("The user must belong to this workspace");
    }
    await channelRef.collection("members").doc(targetUid).set(
      { userId: targetUid, joinedAt: serverTimestamp(), lastReadAt: null },
      { merge: true },
    );
    return { userId: targetUid };
  }

  async removeMember(channelId, actorUid, targetUid) {
    const { channelRef, channel, workspaceMembership } =
      await this._channelAccess(channelId, actorUid, { requireMembership: true });
    if (channel.get("type") !== "channel") {
      throw Errors.validation("Conversation membership cannot be changed here");
    }
    const canManage =
      channel.get("createdBy") === actorUid ||
      canManageWorkspace(workspaceMembership.get("role"));
    if (!canManage && actorUid !== targetUid) {
      throw Errors.forbidden("You cannot manage channel members");
    }
    if (channel.get("createdBy") === targetUid) {
      throw Errors.conflict(
        "The channel creator cannot leave before transferring ownership",
      );
    }
    await channelRef.collection("members").doc(targetUid).delete();
    return { userId: targetUid };
  }

  async update(channelId, actorUid, updates) {
    const { channelRef, channel, workspaceMembership } =
      await this._channelAccess(channelId, actorUid, { requireMembership: true });
    if (channel.get("type") !== "channel") {
      throw Errors.validation("Conversation settings cannot be changed here");
    }
    const canManage =
      channel.get("createdBy") === actorUid ||
      canManageWorkspace(workspaceMembership.get("role"));
    if (!canManage) throw Errors.forbidden("You cannot manage this channel");
    await channelRef.update({ ...updates, updatedAt: serverTimestamp() });
    return this.getForUser(channelId, actorUid);
  }

  async listMembers(channelId, uid) {
    const { channelRef } = await this._channelAccess(channelId, uid);
    const members = await channelRef.collection("members").get();
    return Promise.all(
      members.docs.map(async (member) => {
        const profile = await this.db.collection("users").doc(member.id).get();
        const lastSeen = member.get("lastSeenAt")?.toMillis?.() || 0;
        const typingExpiresAt = member.get("typingExpiresAt") || 0;
        return {
          userId: member.id,
          displayName: profile.get("displayName") || "Workspace member",
          avatarUrl: profile.get("avatarUrl") || null,
          lastReadAt: member.get("lastReadAt") || null,
          lastSeenAt: member.get("lastSeenAt") || null,
          isOnline: Date.now() - lastSeen < 60_000,
          isTyping:
            typeof typingExpiresAt === "number" && typingExpiresAt > Date.now(),
        };
      }),
    );
  }

  async heartbeat(channelId, uid, { isTyping } = {}) {
    const { channelRef } = await this._channelAccess(channelId, uid, {
      requireMembership: true,
    });
    await channelRef.collection("members").doc(uid).update({
      lastSeenAt: serverTimestamp(),
      ...(isTyping === undefined
        ? {}
        : { typingExpiresAt: isTyping ? Date.now() + 7000 : null }),
    });
    return { ok: true };
  }

  async markRead(channelId, uid, messageId) {
    const { channelRef } = await this._channelAccess(channelId, uid, {
      requireMembership: true,
    });
    await channelRef.collection("members").doc(uid).update({
      lastReadAt: serverTimestamp(),
      ...(messageId ? { lastReadMessageId: messageId } : {}),
    });
    return { ok: true };
  }
}