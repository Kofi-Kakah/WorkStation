import AnalyticsService from "./analytics.service.js";

export default class AnalyticsController {
  constructor(service = new AnalyticsService()) {
    this.service = service;
  }

  async workspace(req, res, next) {
    try {
      const analytics = await this.service.workspace(
        req.query.workspaceId,
        req.user.uid,
        { includeIssues: req.query.includeIssues === "true" },
      );
      return res.json({ ok: true, analytics });
    } catch (error) {
      next(error);
    }
  }
}