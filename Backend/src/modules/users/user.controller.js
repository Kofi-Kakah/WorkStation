import UserService from "./user.service.js";
import { Errors } from "../../shared/errors/index.js";

/**
 * User controller. Thin: delegates all logic to the service.
 */
export default class UserController {
  constructor() {
    this.service = new UserService();
  }

  async getMe(req, res, next) {
    try {
      const profile = await this.service.getProfile(req.user.uid);
      if (!profile) throw Errors.notFound("User profile not found");
      return res.json({ ok: true, user: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      const profile = await this.service.updateProfile(
        req.user.uid,
        req.body,
        req.user,
      );
      return res.json({ ok: true, user: profile });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await this.service.getProfile(
        req.params.userId,
        req.user.uid,
      );
      if (!profile) throw Errors.notFound("User not found");
      return res.json({ ok: true, user: profile });
    } catch (error) {
      next(error);
    }
  }

  async requestAvatarUpload(req, res, next) {
    try {
      const result = await this.service.requestAvatarUpload(
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
