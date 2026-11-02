import WorkspaceRepository from "./workspace.repository.js";
import { Errors } from "../../shared/errors/index.js";

export default class WorkspaceService {
  constructor(repository = new WorkspaceRepository()) {
    this.repository = repository;
  }

  async list(uid) {
    return this.repository.listForUser(uid);
  }

  async create(uid, input) {
    try {
      return await this.repository.createForUser(uid, input);
    } catch (error) {
      if (error?.code === "USER_PROFILE_NOT_FOUND") {
        throw Errors.notFound("User profile not found");
      }
      throw error;
    }
  }

  async get(workspaceId, uid) {
    const workspace = await this.repository.getForUser(workspaceId, uid);
    if (!workspace) throw Errors.notFound("Workspace not found");
    return workspace;
  }

  async update(workspaceId, uid, updates) {
    return this.repository.update(workspaceId, uid, updates);
  }

  async listMembers(workspaceId, uid) {
    return this.repository.listMembers(workspaceId, uid);
  }

  async updateMemberRole(workspaceId, actorUid, targetUid, role) {
    return this.repository.updateMemberRole(
      workspaceId,
      actorUid,
      targetUid,
      role,
    );
  }

  async removeMember(workspaceId, actorUid, targetUid) {
    await this.repository.removeMember(workspaceId, actorUid, targetUid);
  }
}
