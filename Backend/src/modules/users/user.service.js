import UserRepository from "./user.repository.js";
import WorkspaceRepository from "../workspaces/workspace.repository.js";
import { ROLES } from "../../shared/services/permissionService.js";
import { Errors } from "../../shared/errors/index.js";
import { serverTimestamp } from "../../shared/utils/index.js";

/**
 * User service. Owns all user-profile business logic.
 */
export default class UserService {
  constructor(
    repository = new UserRepository(),
    workspaceRepository = new WorkspaceRepository(),
  ) {
    this.repository = repository;
    this.workspaces = workspaceRepository;
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
      workspaceIds: [],
      notificationPreferences: { email: true, inApp: true, push: true },
      searchLower: displayName.toLowerCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await this.repository.upsert(firebaseUser.uid, profile);
    return { id: firebaseUser.uid, ...profile };
  }

  async getProfile(uid, actorUid = uid) {
    const profile = await this.repository.findById(uid);
    if (!profile) return null;
    if (uid === actorUid) return profile;

    const [actorWorkspaces, targetWorkspaces] = await Promise.all([
      this.workspaces.listForUser(actorUid),
      this.workspaces.listForUser(uid),
    ]);
    const sharedWorkspaceIds = new Set(
      actorWorkspaces.map((workspace) => workspace.id),
    );
    if (
      !targetWorkspaces.some((workspace) =>
        sharedWorkspaceIds.has(workspace.id),
      )
    ) {
      throw Errors.notFound("User not found");
    }

    return {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
    };
  }

  async updateProfile(uid, updates) {
    const safe = { ...updates };
    if (safe.displayName !== undefined) {
      safe.displayName = safe.displayName.trim();
      safe.searchLower = safe.displayName.toLowerCase();
    }
    if (safe.notificationPreferences) {
      const current = await this.repository.findById(uid);
      safe.notificationPreferences = {
        ...current?.notificationPreferences,
        ...safe.notificationPreferences,
      };
    }

    const profile = await this.repository.upsert(uid, safe);
    return profile;
  }

  async requestAvatarUpload(_uid, _body) {
    // Placeholder for Section 18 (Firebase Storage signed URL).
    return {
      uploadUrl: null,
      downloadUrl: null,
      storagePath: null,
      stub: true,
    };
  }
}
