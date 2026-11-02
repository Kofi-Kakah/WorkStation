import ChannelService from "./channel.service.js";

export default class ChannelController {
  constructor(service = new ChannelService()) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const channels = await this.service.list(req.query.workspaceId, req.user.uid);
      return res.json({ ok: true, channels });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const channel = await this.service.create(req.user.uid, req.body);
      return res.status(201).json({ ok: true, channel });
    } catch (error) {
      next(error);
    }
  }

  async join(req, res, next) {
    try {
      const channel = await this.service.join(req.params.channelId, req.user.uid);
      return res.json({ ok: true, channel });
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const channel = await this.service.get(req.params.channelId, req.user.uid);
      return res.json({ ok: true, channel });
    } catch (error) {
      next(error);
    }
  }

  async listConversations(req, res, next) {
    try {
      const conversations = await this.service.listConversations(
        req.query.workspaceId,
        req.user.uid,
      );
      return res.json({ ok: true, conversations });
    } catch (error) {
      next(error);
    }
  }

  async createConversation(req, res, next) {
    try {
      const conversation = await this.service.createConversation(
        req.user.uid,
        req.body,
      );
      return res.status(201).json({ ok: true, conversation });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req, res, next) {
    try {
      const member = await this.service.addMember(
        req.params.channelId,
        req.user.uid,
        req.body.userId,
      );
      return res.status(201).json({ ok: true, member });
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const result = await this.service.removeMember(
        req.params.channelId,
        req.user.uid,
        req.params.userId,
      );
      return res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const channel = await this.service.update(
        req.params.channelId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true, channel });
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req, res, next) {
    try {
      const members = await this.service.listMembers(
        req.params.channelId,
        req.user.uid,
      );
      return res.json({ ok: true, members });
    } catch (error) {
      next(error);
    }
  }

  async heartbeat(req, res, next) {
    try {
      await this.service.heartbeat(
        req.params.channelId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      await this.service.markRead(
        req.params.channelId,
        req.user.uid,
        req.body.messageId,
      );
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
}