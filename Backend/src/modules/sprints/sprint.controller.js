import SprintService from "./sprint.service.js";

export default class SprintController {
  constructor(service = new SprintService()) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const sprints = await this.service.list(
        req.query.projectId,
        req.user.uid,
      );
      return res.json({ ok: true, sprints });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const sprint = await this.service.create(req.user.uid, req.body);
      return res.status(201).json({ ok: true, sprint });
    } catch (error) {
      next(error);
    }
  }

  async setStatus(req, res, next) {
    try {
      const sprint = await this.service.setStatus(
        req.params.sprintId,
        req.user.uid,
        req.body.status,
      );
      return res.json({ ok: true, sprint });
    } catch (error) {
      next(error);
    }
  }

  async assignIssues(req, res, next) {
    try {
      const result = await this.service.assignIssues(
        req.params.sprintId,
        req.user.uid,
        req.body.issueIds,
      );
      return res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
