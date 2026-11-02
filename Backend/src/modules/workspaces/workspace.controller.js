import WorkspaceService from "./workspace.service.js";

export default class WorkspaceController {
  constructor(service = new WorkspaceService()) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      return res.json({
        ok: true,
        workspaces: await this.service.list(req.user.uid),
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const workspace = await this.service.create(req.user.uid, req.body);
      return res.status(201).json({ ok: true, workspace });
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const workspace = await this.service.get(
        req.params.workspaceId,
        req.user.uid,
      );
      return res.json({ ok: true, workspace });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const workspace = await this.service.update(
        req.params.workspaceId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true, workspace });
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req, res, next) {
    try {
      const members = await this.service.listMembers(
        req.params.workspaceId,
        req.user.uid,
      );
      return res.json({ ok: true, members });
    } catch (error) {
      next(error);
    }
  }

  async updateMemberRole(req, res, next) {
    try {
      const member = await this.service.updateMemberRole(
        req.params.workspaceId,
        req.user.uid,
        req.params.userId,
        req.body.role,
      );
      return res.json({ ok: true, member });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      await this.service.removeMember(
        req.params.workspaceId,
        req.user.uid,
        req.params.userId,
      );
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
}
