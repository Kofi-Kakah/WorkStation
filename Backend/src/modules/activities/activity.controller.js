import { getFirestore } from "../../config/firebase.js";
import { Errors } from "../../shared/errors/index.js";
import ActivityService from "../../shared/services/activityService.js";

export default class ActivityController {
  constructor(service = ActivityService, db = getFirestore()) {
    this.service = service;
    this.db = db;
  }

  async list(req, res, next) {
    try {
      const member = await this.db
        .collection("workspaces")
        .doc(req.query.workspaceId)
        .collection("members")
        .doc(req.user.uid)
        .get();
      if (!member.exists) throw Errors.notFound("Workspace not found");

      const result = await this.service.list(
        req.query.workspaceId,
        req.query,
        this.db,
      );
      return res.json({ ok: true, ...result });
    } catch (error) {
      return next(error);
    }
  }
}