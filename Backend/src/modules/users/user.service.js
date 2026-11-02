import { getAuth } from "../../config/firebase.js";
import UserRepository from "./user.repository.js";
import { ROLES } from "../../shared/services/permissionService.js";
import { generateId, serverTimestamp } from "../../shared/utils/index.js";

const auth = getAuth();
const repo = new UserRepository();

/**
 * User service. Owns all user-profile business logic.
 */
export default class UserService {
  constructor(repository = repo) {
    this.repository = repository;
  }

  /**
   * Ensure a Firestore profile exists for a Firebase Auth user.
   * Called from /auth/verify and /auth/me. Creates the record on first auth.
   * Returns the profile, creating it if missing.
   */
  async ensureProfile(firebaseUser) {
    if (!firebaseUser) return null;

    const existing = await this.repository.findById(firebaseUser.uid);
    if (existing) return existing;

    const displayName =
      firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User";
    const profile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || null,
      emailVerified: firebaseUser.emailVerified === true,
      displayName,
      bio: "",
      avatarUrl: firebaseUser.photoURL || null,
      timezone: null,
      locale: null,
      role: ROLES.MEMBER,
      notificationPreferences: { email: true, inApp: true, push: true },
      searchLower: displayName.toLowerCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await this.repository.upsert(firebaseUser.uid, profile);
    return { id: firebaseUser.uid, ...profile };
  }

  async getProfile(uid) {
    return this.repository.findById(uid);
  }

  async updateProfile(uid, updates, actor) {
    if ("role" in updates) {
      const err = new Error("Role changes are not permitted here");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    const safe = { ...updates };
    if (safe.displayName) safe.searchLower = safe.displayName.toLowerCase();

    const profile = await this.repository.upsert(uid, safe);
    return profile;
  }

  async requestAvatarUpload(uid, body) {
    // Placeholder for Section 18 (Firebase Storage signed URL).
    return {
      uploadUrl: null,
      downloadUrl: null,
      storagePath: null,
      stub: true,
    };
  }
}
