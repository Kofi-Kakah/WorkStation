import { createHash } from "node:crypto";
import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";
import ChannelRepository from "../channels/channel.repository.js";
import AttachmentRepository from "../attachments/attachment.repository.js";
import NotificationService from "../../shared/services/notificationService.js";

function timestampMillis(timestamp) {
  if (typeof timestamp?.toMillis === "function") return timestamp.toMillis();
  if (timestamp instanceof Date) return timestamp.getTime();
  return null;
}

function reactionId(uid, emoji) {
  return createHash("sha256").update(`${uid}:${emoji}`).digest("hex");
}

function messageFromSnapshot(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAtMs: timestampMillis(data.createdAt),
    updatedAtMs: timestampMillis(data.updatedAt),
  };
}

export default class MessageRepository {
  constructor(
    db = getFirestore(),
    channelRepository = new ChannelRepository(db),
    attachmentRepository = new AttachmentRepository(db, channelRepository),
  ) {
    this.db = db;
    this.channelRepository = channelRepository;
    this.attachmentRepository = attachmentRepository;
  }

  async _hydrate(snapshot, uid) {
    const message = messageFromSnapshot(snapshot);
    message.attachments = await this.attachmentRepository.getForMessages(
      snapshot.ref.path.split("/")[1],
      uid,
      message.attachmentIds || [],
    );
    return message;
  }

  async list(channelId, uid, { limit, before, parentMessageId = null }) {
    const { channelRef } = await this.channelRepository.getAccess(
      channelId,
      uid,
    );
    let query = channelRef
      .collection("messages")
      .where("parentMessageId", "==", parentMessageId)
      .orderBy("createdAt", parentMessageId ? "asc" : "desc")
      .limit(limit);
    if (before && !parentMessageId) {
      const cursor = await channelRef.collection("messages").doc(before).get();
      if (!cursor.exists) throw Errors.validation("Invalid message cursor");
      query = channelRef
        .collection("messages")
        .where("parentMessageId", "==", null)
        .orderBy("createdAt", "desc")
        .startAfter(cursor)
        .limit(limit);
    }
    const result = await query.get();
    let messages = await Promise.all(
      result.docs.map((snapshot) => this._hydrate(snapshot, uid)),
    );
    if (!parentMessageId) messages = messages.reverse();
    return {
      messages,
      nextBefore:
        result.docs.length === limit
          ? result.docs[result.docs.length - 1].id
          : null,
    };
  }

  async get(channelId, messageId, uid) {
    const { channelRef } = await this.channelRepository.getAccess(
      channelId,
      uid,
    );
    const message = await channelRef
      .collection("messages")
      .doc(messageId)
      .get();
    if (!message.exists) throw Errors.notFound("Message not found");
    return this._hydrate(message, uid);
  }

  async create(channelId, uid, input) {
    const { channelRef, channel } = await this.channelRepository.getAccess(
      channelId,
      uid,
      { requireMembership: true },
    );
    const memberRef = channelRef.collection("members").doc(uid);
    const member = await memberRef.get();
    if (!member.exists) throw Errors.forbidden("Join this channel to post");

    const mentions = [...new Set(input.mentions)];
    const attachmentIds = await this.attachmentRepository.validateForAttach(
      channelId,
      uid,
      input.attachmentIds || [],
    );
    const userProfile = await this.db.collection("users").doc(uid).get();
    const messageId = generateId();
    const messageRef = channelRef.collection("messages").doc(messageId);
    const timestamp = serverTimestamp();
    const parentMessageId = input.parentMessageId || null;
    if (parentMessageId) {
      const parent = await channelRef
        .collection("messages")
        .doc(parentMessageId)
        .get();
      if (
        !parent.exists ||
        parent.get("parentMessageId") ||
        parent.get("isDeleted")
      ) {
        throw Errors.notFound("Thread message not found");
      }
    }

    const message = {
      content: input.content,
      senderId: uid,
      senderName: userProfile.get("displayName") || "Workspace member",
      senderAvatarUrl: userProfile.get("avatarUrl") || null,
      parentMessageId,
      mentions,
      attachmentIds,
      reactionSummary: [],
      isEdited: false,
      isDeleted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const workspaceRef = this.db
      .collection("workspaces")
      .doc(channel.get("workspaceId"));
    let pushNotifications = [];
    await this.db.runTransaction(async (transaction) => {
      pushNotifications = [];
      const [currentChannel, workspaceMember, channelMember, parent, members] =
        await Promise.all([
          transaction.get(channelRef),
          transaction.get(workspaceRef.collection("members").doc(uid)),
          transaction.get(memberRef),
          parentMessageId
            ? transaction.get(
                channelRef.collection("messages").doc(parentMessageId),
              )
            : Promise.resolve(null),
          transaction.get(channelRef.collection("members")),
        ]);
      if (
        !currentChannel.exists ||
        currentChannel.get("archived") ||
        !workspaceMember.exists ||
        !channelMember.exists
      ) {
        throw Errors.notFound("Channel not found");
      }
      if (
        parentMessageId &&
        (!parent?.exists ||
          parent.get("parentMessageId") ||
          parent.get("isDeleted"))
      ) {
        throw Errors.notFound("Thread message not found");
      }
      const mentionedMembers = await Promise.all(
        mentions.map((userId) =>
          transaction.get(channelRef.collection("members").doc(userId)),
        ),
      );
      if (mentionedMembers.some((snapshot) => !snapshot.exists)) {
        throw Errors.validation(
          "Mentioned users must be members of this conversation",
        );
      }

      const targets = new Map();
      if (["direct", "group"].includes(currentChannel.get("type"))) {
        members.docs.forEach((snapshot) => {
          if (snapshot.id !== uid) {
            targets.set(snapshot.id, {
              type: "message",
              title: "New direct message",
            });
          }
        });
      }
      if (parent?.exists && parent.get("senderId") !== uid) {
        targets.set(parent.get("senderId"), {
          type: "reply",
          title: "New reply to your message",
        });
      }
      mentions.forEach((userId) => {
        if (userId !== uid) {
          targets.set(userId, { type: "mention", title: "You were mentioned" });
        }
      });
      const recipientProfiles = new Map(
        await Promise.all(
          [...targets.keys()].map(async (userId) => [
            userId,
            await transaction.get(this.db.collection("users").doc(userId)),
          ]),
        ),
      );

      transaction.create(messageRef, message);
      transaction.update(channelRef, {
        lastMessageAt: timestamp,
        updatedAt: timestamp,
      });
      const linkPrefix =
        currentChannel.get("type") === "channel" ? "/channels" : "/dm";
      for (const [userId, target] of targets) {
        const notification = NotificationService.recordWithinTransaction(
          transaction,
          this.db,
          {
            userId,
            workspaceId: currentChannel.get("workspaceId"),
            type: target.type,
            title: target.title,
            body: input.content || "Shared an attachment",
            resource: {
              type: "message",
              id: messageId,
              channelId,
            },
            link: `${linkPrefix}?channelId=${encodeURIComponent(channelId)}&messageId=${encodeURIComponent(messageId)}`,
            actorId: uid,
            dedupeKey: `message-${messageId}-${userId}`,
            recipientProfile: recipientProfiles.get(userId)?.data(),
          },
        );
        if (notification?.pushEnabled) {
          pushNotifications.push({ userId, payload: notification.payload });
        }
      }
    });
    await Promise.all(
      pushNotifications.map((notification) =>
        NotificationService.dispatchPush(
          notification.userId,
          notification.payload,
          this.db,
        ),
      ),
    );
    return this._hydrate(await messageRef.get(), uid);
  }

  async update(channelId, messageId, uid, updates) {
    const { channelRef } = await this.channelRepository.getAccess(
      channelId,
      uid,
      { requireMembership: true },
    );
    const messageRef = channelRef.collection("messages").doc(messageId);
    await this.db.runTransaction(async (transaction) => {
      const message = await transaction.get(messageRef);
      if (!message.exists || message.get("isDeleted")) {
        throw Errors.notFound("Message not found");
      }
      if (message.get("senderId") !== uid) {
        throw Errors.forbidden("You can only edit your own messages");
      }
      if (updates.mentions) {
        const mentionedMembers = await Promise.all(
          updates.mentions.map((userId) =>
            transaction.get(channelRef.collection("members").doc(userId)),
          ),
        );
        if (mentionedMembers.some((snapshot) => !snapshot.exists)) {
          throw Errors.validation(
            "Mentioned users must be members of this conversation",
          );
        }
      }
      transaction.update(messageRef, {
        content: updates.content,
        ...(updates.mentions ? { mentions: [...new Set(updates.mentions)] } : {}),
        isEdited: true,
        updatedAt: serverTimestamp(),
      });
    });
    return this._hydrate(await messageRef.get(), uid);
  }

  async remove(channelId, messageId, uid) {
    const { channelRef } = await this.channelRepository.getAccess(
      channelId,
      uid,
      { requireMembership: true },
    );
    const messageRef = channelRef.collection("messages").doc(messageId);
    await this.db.runTransaction(async (transaction) => {
      const message = await transaction.get(messageRef);
      if (!message.exists || message.get("isDeleted")) {
        throw Errors.notFound("Message not found");
      }
      if (message.get("senderId") !== uid) {
        throw Errors.forbidden("You can only delete your own messages");
      }
      transaction.update(messageRef, {
        content: "",
        mentions: [],
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });
    });
    return { ok: true };
  }

  async toggleReaction(channelId, messageId, uid, emoji) {
    const { channelRef } = await this.channelRepository.getAccess(
      channelId,
      uid,
      { requireMembership: true },
    );
    const messageRef = channelRef.collection("messages").doc(messageId);
    const reactionRef = messageRef
      .collection("reactions")
      .doc(reactionId(uid, emoji));
    let resultSummary = [];
    let reacted = false;
    await this.db.runTransaction(async (transaction) => {
      const [message, reaction] = await Promise.all([
        transaction.get(messageRef),
        transaction.get(reactionRef),
      ]);
      if (!message.exists || message.get("isDeleted")) {
        throw Errors.notFound("Message not found");
      }
      const summary = message.get("reactionSummary") || [];
      const previous = summary.find((item) => item.emoji === emoji);
      const nextCount = (previous?.count || 0) + (reaction.exists ? -1 : 1);
      resultSummary = summary
        .filter((item) => item.emoji !== emoji)
        .concat(nextCount > 0 ? [{ emoji, count: nextCount }] : []);
      if (reaction.exists) {
        transaction.delete(reactionRef);
      } else {
        transaction.create(reactionRef, {
          userId: uid,
          emoji,
          createdAt: serverTimestamp(),
        });
        reacted = true;
      }
      transaction.update(messageRef, {
        reactionSummary: resultSummary,
        updatedAt: serverTimestamp(),
      });
    });
    return { reactionSummary: resultSummary, reacted };
  }

  async search(channelId, uid, queryText, limit) {
    const { channelRef } = await this.channelRepository.getAccess(
      channelId,
      uid,
    );
    const result = await channelRef
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();
    const searchTerm = queryText.toLocaleLowerCase();
    const matches = result.docs
      .filter(
        (snapshot) =>
          !snapshot.get("isDeleted") &&
          String(snapshot.get("content") || "")
            .toLocaleLowerCase()
            .includes(searchTerm),
      )
      .slice(0, limit);
    return Promise.all(matches.map((snapshot) => this._hydrate(snapshot, uid)));
  }

  async subscribe(channelId, uid, onChange, onError) {
    const { channelRef, channel } = await this.channelRepository.getAccess(
      channelId,
      uid,
    );
    const workspaceRef = this.db
      .collection("workspaces")
      .doc(channel.get("workspaceId"));
    const unsubscribeMessages = channelRef
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(50)
      .onSnapshot(onChange, onError);
    const unsubscribeWorkspace = workspaceRef
      .collection("members")
      .doc(uid)
      .onSnapshot((snapshot) => {
        if (!snapshot.exists) onError(new Error("Workspace access was revoked"));
      }, onError);
    const unsubscribers = [unsubscribeMessages, unsubscribeWorkspace];
    if (channel.get("visibility") === "private") {
      unsubscribers.push(
        channelRef
          .collection("members")
          .doc(uid)
          .onSnapshot((snapshot) => {
            if (!snapshot.exists) onError(new Error("Channel access was revoked"));
          }, onError),
      );
    }
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }
}