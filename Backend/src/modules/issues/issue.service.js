import IssueRepository from "./issue.repository.js";

export default class IssueService {
  constructor(repository = new IssueRepository()) {
    this.repository = repository;
  }

  list(projectId, uid, filters = {}) {
    return this.repository.list(projectId, uid, filters);
  }

  create(uid, input) {
    return this.repository.create(input.projectId, uid, input);
  }

  get(issueId, uid) {
    return this.repository.get(issueId, uid);
  }

  update(issueId, uid, updates) {
    return this.repository.update(issueId, uid, updates);
  }

  updateStatus(issueId, uid, status) {
    return this.repository.updateStatus(issueId, uid, status);
  }

  updateAssignee(issueId, uid, assigneeId) {
    return this.repository.updateAssignee(issueId, uid, assigneeId);
  }

  createComment(issueId, uid, input) {
    return this.repository.createComment(issueId, uid, input);
  }

  listComments(issueId, uid) {
    return this.repository.listComments(issueId, uid);
  }
}
