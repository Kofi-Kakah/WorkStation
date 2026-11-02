import { getFirestore } from "../../config/firebase.js";
import { generateId, serverTimestamp } from "../utils/index.js";

const fs = getFirestore();

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
  }) {
    if (!userId) return null;

    // De-duplicate: if a notification with the same dedupeKey already exists
    // and is unread, do not create a duplicate.
    if (dedupeKey) {
      const dup = await fs
        .collection(`users/${userId}/notifications`)
        .where("dedupeKey", "==", dedupeKey)
        .where("read", "==", false)
        .limit(1)
        .get();
      if (!dup.empty)
        return {
          id: dup.docs[0].id,
          ...dup.docs[0].data(),
          deduplicated: true,
        };
    }

    const id = generateId();
    const ref = fs.collection(`users/${userId}/notifications`).doc(id);

    await ref.set({
      id,
      userId,
      workspaceId: workspaceId || null,
      type: type || "info",
      title: title || "",
      body: body || "",
      resource: resource || null,
      link: link || null,
      actorId: actorId || null,
      dedupeKey,
      read: false,
      data: data || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id, deduplicated: false };
  },

  async markRead(userId, notificationId) {
    const ref = fs
      .collection(`users/${userId}/notifications`)
      .doc(notificationId);
    const snap = await ref.get();
    if (!snap.exists) return null;
    await ref.update({
      read: true,
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: notificationId, read: true };
  },

  async markAllRead(userId) {
    const batch = fs.batch();
    const unread = await fs
      .collection(`users/${userId}/notifications`)
      .where("read", "==", false)
      .get();
    if (unread.empty) return { count: 0 };
    unread.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
    return { count: unread.size };
  },

  async list(userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
    let q = fs
      .collection(`users/${userId}/notifications`)
      .orderBy("createdAt", "desc")
      .limit(limit + 1);
    if (unreadOnly) q = q.where("read", "==", false);
    const snap = await q.get();
    const docs = snap.docs.slice(offset, offset + limit);
    const items = docs.map((d) => ({ id: d.id, ...d.data() }));
    const unreadSnap = await fs
      .collection(`users/${userId}/notifications`)
      .where("read", "==", false)
      .get();
    return { items, unreadCount: unreadSnap.size, hasMore: snap.size > limit };
  },
};

export default NotificationService;
