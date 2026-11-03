import SavedViewsService from "./savedViews.service.js";

export default class SavedViewsController {
  constructor(service = new SavedViewsService()) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const views = await this.service.list(
        req.query.workspaceId,
        req.user.uid,
      );
      return res.json({ ok: true, views });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const view = await this.service.create(
        req.body.workspaceId,
        req.user.uid,
        req.body,
      );
      return res.status(201).json({ ok: true, view });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await this.service.remove(
        req.query.workspaceId,
        req.user.uid,
        req.params.viewId,
      );
      return res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
