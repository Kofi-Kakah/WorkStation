import NotificationService from "../../shared/services/notificationService.js";

export default class NotificationController {
  constructor(service = NotificationService) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const result = await this.service.list(req.user.uid, req.query);
      return res.json({ ok: true, ...result });
    } catch (error) {
      return next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      const notification = await this.service.markRead(
        req.user.uid,
        req.params.notificationId,
      );
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      return res.json({ ok: true, notification });
    } catch (error) {
      return next(error);
    }
  }

  async markAllRead(req, res, next) {
    try {
      const result = await this.service.markAllRead(req.user.uid);
      return res.json({ ok: true, ...result });
    } catch (error) {
      return next(error);
    }
  }

  async registerDevice(req, res, next) {
    try {
      const device = await this.service.registerDevice(req.user.uid, req.body);
      return res.status(201).json({ ok: true, device });
    } catch (error) {
      return next(error);
    }
  }

  async removeDevice(req, res, next) {
    try {
      const device = await this.service.removeDevice(
        req.user.uid,
        req.body.token,
      );
      return res.json({ ok: true, device });
    } catch (error) {
      return next(error);
    }
  }
}