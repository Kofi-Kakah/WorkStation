import InvitationService from "./invitation.service.js";

export default class InvitationController {
  constructor(service = new InvitationService()) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const invitations = await this.service.list(
        req.params.workspaceId,
        req.user.uid,
      );
      return res.json({ ok: true, invitations });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const invitation = await this.service.create(
        req.params.workspaceId,
        req.user.uid,
        req.body,
      );
      return res.status(201).json({ ok: true, invitation });
    } catch (error) {
      next(error);
    }
  }

  async accept(req, res, next) {
    try {
      const invitation = await this.service.respond(
        req.params.token,
        req.user,
        "accept",
      );
      return res.json({ ok: true, invitation });
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const invitation = await this.service.respond(
        req.params.token,
        req.user,
        "reject",
      );
      return res.json({ ok: true, invitation });
    } catch (error) {
      next(error);
    }
  }
}