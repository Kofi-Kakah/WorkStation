import ProjectService from "./project.service.js";

export default class ProjectController {
  constructor(service = new ProjectService()) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const projects = await this.service.list(
        req.query.workspaceId,
        req.user.uid,
      );
      return res.json({ ok: true, projects });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const project = await this.service.create(req.user.uid, req.body);
      return res.status(201).json({ ok: true, project });
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const project = await this.service.get(req.params.projectId, req.user.uid);
      return res.json({ ok: true, project });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const project = await this.service.update(
        req.params.projectId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true, project });
    } catch (error) {
      next(error);
    }
  }

  async archive(req, res, next) {
    try {
      await this.service.archive(req.params.projectId, req.user.uid);
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await this.service.delete(req.params.projectId, req.user.uid);
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req, res, next) {
    try {
      const members = await this.service.listMembers(
        req.params.projectId,
        req.user.uid,
      );
      return res.json({ ok: true, members });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req, res, next) {
    try {
      const member = await this.service.addMember(
        req.params.projectId,
        req.user.uid,
        req.body,
      );
      return res.status(201).json({ ok: true, member });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      await this.service.removeMember(
        req.params.projectId,
        req.user.uid,
        req.params.userId,
      );
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
}