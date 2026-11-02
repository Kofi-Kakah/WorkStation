import ProjectRepository from "./project.repository.js";

export default class ProjectService {
  constructor(repository = new ProjectRepository()) {
    this.repository = repository;
  }

  list(workspaceId, uid) {
    return this.repository.listForWorkspace(workspaceId, uid);
  }

  create(uid, { workspaceId, ...input }) {
    return this.repository.create(workspaceId, uid, input);
  }

  get(projectId, uid) {
    return this.repository.get(projectId, uid);
  }

  update(projectId, uid, updates) {
    return this.repository.update(projectId, uid, updates);
  }

  archive(projectId, uid) {
    return this.repository.archive(projectId, uid);
  }

  delete(projectId, uid) {
    return this.repository.delete(projectId, uid);
  }

  listMembers(projectId, uid) {
    return this.repository.listMembers(projectId, uid);
  }

  addMember(projectId, uid, { userId, role }) {
    return this.repository.addMember(projectId, uid, userId, role);
  }

  removeMember(projectId, uid, userId) {
    return this.repository.removeMember(projectId, uid, userId);
  }
}