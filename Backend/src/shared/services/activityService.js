import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../errors/index.js";
import { generateId, serverTimestamp } from "../utils/index.js";

const fs = getFirestore();

/**
 * Activity service — workspace-scoped event log.
 *
 * Records live in `workspaces/{workspaceId}/activities/{activityId}`.
 * Each entry: { actorId, actorName, action, resource, timestamp, context }
 */
export const ActivityService = {
  recordWithinTransaction(
    transaction,
    db,
    workspaceId,
    { actorId, actorName, action, resource, context = {} },
  ) {
    if (!workspaceId) return null;
    const id = generateId();
    const ref = db.collection(`workspaces/${workspaceId}/activities`).doc(id);
    transaction.create(ref, {
      id,
      workspaceId,
      actorId: actorId || null,
      actorName: actorName || null,
      action,
      resource: resource || null,
      context: context || {},
      createdAt: serverTimestamp(),
    });
    return { id };
  },

  async record(
    workspaceId,
    { actorId, actorName, action, resource, context = {} },
  ) {
    if (!workspaceId) return null;
    const id = generateId();
    const ref = fs.collection(`workspaces/${workspaceId}/activities`).doc(id);
    await ref.set({
      id,
      workspaceId,
      actorId: actorId || null,
      actorName: actorName || null,
      action,
      resource: resource || null,
      context: context || {},
      createdAt: serverTimestamp(),
    });
    return { id };
  },

  async list(
    workspaceId,
    { limit = 20, cursor = null, resource = null } = {},
    db = fs,
  ) {
    let q = db
      .collection(`workspaces/${workspaceId}/activities`)
      .orderBy("createdAt", "desc");
    if (resource)
      q = q
        .where("resource.type", "==", resource.type)
        .where("resource.id", "==", resource.id);
    if (cursor) {
      const cursorSnapshot = await db
        .collection(`workspaces/${workspaceId}/activities`)
        .doc(cursor)
        .get();
      if (!cursorSnapshot.exists) {
        throw Errors.validation("Invalid activity cursor");
      }
      q = q.startAfter(cursorSnapshot);
    }
    const snapshot = await q.limit(limit + 1).get();
    const hasMore = snapshot.docs.length > limit;
    const docs = snapshot.docs.slice(0, limit);
    const items = docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return {
      items,
      hasMore,
      nextCursor: hasMore ? docs.at(-1)?.id || null : null,
    };
  },
};

export default ActivityService;
