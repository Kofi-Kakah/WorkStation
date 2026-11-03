import { getFirestore } from "../../config/firebase.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";

export default class SavedViewsRepository {
  constructor(db = getFirestore()) {
    this.db = db;
  }

  async listForUser(uid) {
    const snapshot = await this.db
      .collection(`users/${uid}/savedIssueViews`)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async create(uid, workspaceId, input) {
    const id = generateId();
    const view = {
      workspaceId,
      name: input.name.trim(),
      filters: input.filters,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await this.db
      .collection(`users/${uid}/savedIssueViews`)
      .doc(id)
      .create(view);
    return { id, ...view };
  }

  get(uid, viewId) {
    return this.db
      .collection(`users/${uid}/savedIssueViews`)
      .doc(viewId)
      .get();
  }

  remove(uid, viewId) {
    return this.db
      .collection(`users/${uid}/savedIssueViews`)
      .doc(viewId)
      .delete();
  }
}
