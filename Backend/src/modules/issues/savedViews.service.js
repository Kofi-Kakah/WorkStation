import { Errors } from "../../shared/errors/index.js";
import ProjectRepository from "../projects/project.repository.js";
import SavedViewsRepository from "./savedViews.repository.js";

export default class SavedViewsService {
  constructor(
    repository = new SavedViewsRepository(),
    projectRepository = new ProjectRepository(),
  ) {
    this.repository = repository;
    this.projectRepository = projectRepository;
  }

  async list(workspaceId, uid) {
    await this.projectRepository.listForWorkspace(workspaceId, uid);
    return (await this.repository.listForUser(uid))
      .filter((view) => view.workspaceId === workspaceId)
      .sort((left, right) => {
        const leftTime = left.createdAt?.toMillis?.() || 0;
        const rightTime = right.createdAt?.toMillis?.() || 0;
        return rightTime - leftTime;
      })
      .slice(0, 25);
  }

  async create(workspaceId, uid, input) {
    await this.projectRepository.listForWorkspace(workspaceId, uid);
    return this.repository.create(uid, workspaceId, input);
  }

  async remove(workspaceId, uid, viewId) {
    await this.projectRepository.listForWorkspace(workspaceId, uid);
    const snapshot = await this.repository.get(uid, viewId);
    if (!snapshot.exists || snapshot.get("workspaceId") !== workspaceId) {
      throw Errors.notFound("Saved view not found");
    }
    await this.repository.remove(uid, viewId);
    return { id: viewId, deleted: true };
  }
}
