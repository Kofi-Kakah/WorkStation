import IssueService from "./issue.service.js";

export default class IssueController {
  constructor(service = new IssueService()) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const projectId = req.query.projectId;
      const issues = await this.service.list(projectId, req.user.uid, {
        status: req.query.status,
        type: req.query.type,
        priority: req.query.priority,
        search: req.query.search,
      });
      return res.json({ ok: true, issues });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const issue = await this.service.create(req.user.uid, req.body);
      return res.status(201).json({ ok: true, issue });
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const issue = await this.service.get(req.params.issueId, req.user.uid);
      return res.json({ ok: true, issue });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const issue = await this.service.update(
        req.params.issueId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true, issue });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const issue = await this.service.updateStatus(
        req.params.issueId,
        req.user.uid,
        req.body.status,
      );
      return res.json({ ok: true, issue });
    } catch (error) {
      next(error);
    }
  }

  async updateAssignee(req, res, next) {
    try {
      const issue = await this.service.updateAssignee(
        req.params.issueId,
        req.user.uid,
        req.body.assigneeId,
      );
      return res.json({ ok: true, issue });
    } catch (error) {
      next(error);
    }
  }

  async createComment(req, res, next) {
    try {
      const comment = await this.service.createComment(
        req.params.issueId,
        req.user.uid,
        req.body,
      );
      return res.status(201).json({ ok: true, comment });
    } catch (error) {
      next(error);
    }
  }

  async listComments(req, res, next) {
    try {
      const comments = await this.service.listComments(req.params.issueId, req.user.uid);
      return res.json({ ok: true, comments });
    } catch (error) {
      next(error);
    }
  }
}
