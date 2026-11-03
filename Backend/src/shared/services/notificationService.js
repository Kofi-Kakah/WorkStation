import { createHash } from "node:crypto";
import { getFirestore, getMessaging } from "../../config/firebase.js";
import { Errors } from "../errors/index.js";
import { generateId, serverTimestamp } from "../utils/index.js";
import logger from "../utils/logger.js";

const fs = getFirestore();

function notificationIdFor(dedupeKey) {
  return createHash("sha256").update(dedupeKey).digest("hex");
}

function notificationPayload(input) {
  return {
    workspaceId: input.workspaceId || null,
    type: input.type || "info",
    title: input.title || "",
    body: input.body || "",
    resource: input.resource || null,
    link: input.link || null,
    actorId: input.actorId || null,
    dedupeKey: input.dedupeKey || null,
    data: input.data || {},
  };
}

/**
 * Shared notification service.
 *
 * Notifications live in:
 *   users/{userId}/notifications/{notificationId}
 *
 * We also keep a workspace-scoped activity record so the activity feed can
 * be queried independently of per-user notification state.
 */
export const NotificationService = {
  recordWithinTransaction(transaction, db, input) {
    if (!input.userId) return null;
    const preferences = input.recipientProfile?.notificationPreferences || {};
    const writeInApp = preferences.inApp !== false;
    const sendPush = preferences.push !== false;
    if (!writeInApp && !sendPush) return null;

    const id = input.dedupeKey
      ? notificationIdFor(input.dedupeKey)
      : generateId();
    const ref = db
      .collection(`users/${input.userId}/notifications`)
      .doc(id);
    const payload = notificationPayload(input);
    if (writeInApp) {
      transaction.create(ref, {
        id,
        userId: input.userId,
        ...payload,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return { id: writeInApp ? id : null, pushEnabled: sendPush, payload };
  },

  async create({
    userId,
    workspaceId,
    type,
    title,
    body,
    resource,
    link,
    actorId,
    dedupeKey = null,
    data = {},
    db = fs,
  }) {
    if (!userId) return null;
    const ref = db
      .collection(`users/${userId}/notifications`)
      .doc(dedupeKey ? notificationIdFor(dedupeKey) : generateId());
    const [existing] = await db.runTransaction(async (transaction) => {
      const [notificationSnapshot, profileSnapshot] = await Promise.all([
        transaction.get(ref),
        transaction.get(db.collection("users").doc(userId)),
      ]);
      if (notificationSnapshot.exists) {
        return [{ id: notificationSnapshot.id, ...notificationSnapshot.data() }];
      }

      const recipientProfile = profileSnapshot.exists
        ? profileSnapshot.data()
        : {};
      const preferences = recipientProfile.notificationPreferences || {};
      const writeInApp = preferences.inApp !== false;
      const sendPush = preferences.push !== false;
      if (!writeInApp && !sendPush) {
        return [{ id: null, suppressed: true }];
      }
      const payload = notificationPayload({
        workspaceId,
        type,
        title,
        body,
        resource,
        link,
        actorId,
        dedupeKey,
        data,
      });
      if (writeInApp) {
        transaction.create(ref, {
          id: ref.path.split("/").at(-1),
          userId,
          ...payload,
          read: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      return [{
          id: writeInApp ? ref.path.split("/").at(-1) : null,
          created: true,
          pushEnabled: sendPush,
          payload,
        }];
    });

    if (existing.created && existing.pushEnabled) {
      return {
        ...existing,
        pushResult: await this.dispatchPush(userId, existing.payload, db),
      };
    }
    return { ...existing, deduplicated: Boolean(existing.id && !existing.created) };
  },

  async dispatchPush(userId, payload, db = fs) {
    let deviceCount = 0;
    try {
      const [profile, devices] = await Promise.all([
        db.collection("users").doc(userId).get(),
        db.collection(`users/${userId}/devices`).get(),
      ]);
      if (
        !profile.exists ||
        profile.get("notificationPreferences")?.push === false ||
        devices.empty
      ) {
        return { sentCount: 0, skipped: true };
      }

      const deviceDocs = devices.docs;
      deviceCount = devices.size;
      let failureCount = 0;
      for (let index = 0; index < deviceDocs.length; index += 500) {
        const batch = deviceDocs.slice(index, index + 500);
        const response = await getMessaging().sendEachForMulticast({
          tokens: batch.map((device) => device.get("token")),
          notification: { title: payload.title, body: payload.body },
          data: {
            link: payload.link || "",
            resourceType: payload.resource?.type || "",
            resourceId: payload.resource?.id || "",
          },
        });
        failureCount += response.failureCount;
        const staleTokens = [];
        response.responses.forEach((result, responseIndex) => {
          if (
            !result.success &&
            ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(
              result.error?.code,
            )
          ) {
            staleTokens.push(batch[responseIndex].ref);
          }
        });
        if (staleTokens.length) {
          const deletionBatch = db.batch();
          staleTokens.forEach((ref) => deletionBatch.delete(ref));
          await deletionBatch.commit();
        }
      }
      return {
        sentCount: devices.size - failureCount,
        failureCount,
        skipped: false,
      };
    } catch (error) {
      logger.warn("Push notification delivery failed", {
        userId,
        error: error?.message || "Unknown messaging error",
      });
      return {
        sentCount: 0,
        failureCount: deviceCount,
        skipped: false,
        error: "Push delivery failed",
      };
    }
  },

  async registerDevice(userId, { token, userAgent }, db = fs) {
    const profile = await db.collection("users").doc(userId).get();
    if (!profile.exists) throw Errors.notFound("User profile not found");
    if (profile.get("notificationPreferences")?.push === false) {
      throw Errors.conflict("Enable push notifications before registering a device");
    }
    const ref = db.collection(`users/${userId}/devices`).doc(
      createHash("sha256").update(token).digest("hex"),
    );
    const existing = await ref.get();
    await ref.set(
      {
        token,
        userAgent: userAgent || null,
        createdAt: existing.exists ? existing.get("createdAt") : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { registered: true };
  },

  async removeDevice(userId, token, db = fs) {
    const ref = db
      .collection(`users/${userId}/devices`)
      .doc(createHash("sha256").update(token).digest("hex"));
    const existing = await ref.get();
    if (!existing.exists) return { removed: false };
    await ref.delete();
    return { removed: true };
  },

  async markRead(userId, notificationId, db = fs) {
    const ref = db
      .collection(`users/${userId}/notifications`)
      .doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    if (snap.get("read")) return { id: notificationId, read: true };
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (!current.exists || current.get("read")) return;
      transaction.update(ref, {
        read: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    return { id: notificationId, read: true };
  },

  async markAllRead(userId, db = fs) {
    let updatedCount = 0;
    let cursor = null;
    while (true) {
      let query = db
        .collection(`users/${userId}/notifications`)
        .where("read", "==", false)
        .orderBy("createdAt", "asc")
        .limit(400);
      if (cursor) query = query.startAfter(cursor);
      const unread = await query.get();
      if (unread.empty) break;
      const batch = db.batch();
      unread.docs.forEach((doc) => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      updatedCount += unread.size;
      cursor = unread.docs.at(-1);
      if (unread.size < 400) break;
    }
    return { count: updatedCount };
  },

  async list(
    userId,
    { limit = 20, cursor = null, unreadOnly = false } = {},
    db = fs,
  ) {
    let q = db
      .collection(`users/${userId}/notifications`)
      .orderBy("createdAt", "desc");
    if (unreadOnly) q = q.where("read", "==", false);
    if (cursor) {
      const cursorSnapshot = await db
        .collection(`users/${userId}/notifications`)
        .doc(cursor)
        .get();
      if (!cursorSnapshot.exists) {
        throw Errors.validation("Invalid notification cursor");
      }
      q = q.startAfter(cursorSnapshot);
    }
    q = q.limit(limit + 1);
    const snap = await q.get();
    const hasMore = snap.docs.length > limit;
    const docs = snap.docs.slice(0, limit);
    const items = docs.map((d) => ({ id: d.id, ...d.data() }));
    const countResult = await db
      .collection(`users/${userId}/notifications`)
      .where("read", "==", false)
      .count()
      .get();
    return {
      items,
      unreadCount: countResult.data().count,
      hasMore,
      nextCursor: hasMore ? docs.at(-1)?.id || null : null,
    };
  },
};

export default NotificationService;
