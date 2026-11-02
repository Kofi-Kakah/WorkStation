import { getFirestore } from "../../config/firebase.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";

const fs = getFirestore();
const COLLECTION = "users";

export class UserRepository {
  async findById(uid) {
    const snap = await fs.collection(COLLECTION).doc(uid).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  }

  async upsert(uid, data) {
    const ref = fs.collection(COLLECTION).doc(uid);
    const payload = {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp(),
    };
    await ref.set(payload, { merge: true });
    const snap = await ref.get();
    return { id: snap.id, ...snap.data() };
  }

  async search(query, limit = 20) {
    // Firestore does not support native full-text search; this is a
    // prefix match on displayName / email and will be replaced by an
    // Algolia/elastic index in a later section if needed.
    const q = query.toLowerCase().trim();
    const snap = await fs.collection(COLLECTION)
      .orderBy("searchLower")
      .startAt(q)
      .endAt(q + "\u{ffff}")
      .limit(limit)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export default UserRepository;
