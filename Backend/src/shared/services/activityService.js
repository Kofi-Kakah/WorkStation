import { getFirestore } from "../../config/firebase.js";
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

  async list(workspaceId, { limit = 50, offset = 0, resource = null } = {}) {
    let q = fs
      .collection(`workspaces/${workspaceId}/activities`)
      .orderBy("createdAt", "desc");
    if (resource)
      q = q
        .where("resource.type", "==", resource.type)
        .where("resource.id", "==", resource.id);
    const snap = await q.limit(limit + 1).get();
    const items = snap.docs
      .slice(offset, offset + limit)
      .map((d) => ({ id: d.id, ...d.data() }));
    return { items, hasMore: snap.size > limit };
  },
};

export default ActivityService;
