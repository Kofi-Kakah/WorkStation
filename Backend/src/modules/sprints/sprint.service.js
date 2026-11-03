import SprintRepository from "./sprint.repository.js";

export default class SprintService {
  constructor(repository = new SprintRepository()) {
    this.repository = repository;
  }

  list(projectId, uid) {
    return this.repository.list(projectId, uid);
  }

  create(uid, input) {
    return this.repository.create(uid, input);
  }

  setStatus(sprintId, uid, status) {
    return this.repository.setStatus(sprintId, uid, status);
  }

  assignIssues(sprintId, uid, issueIds) {
    return this.repository.assignIssues(sprintId, uid, issueIds);
  }
}
