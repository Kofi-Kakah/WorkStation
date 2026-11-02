import MessageService from "./message.service.js";
import logger from "../../shared/utils/logger.js";

export default class MessageController {
  constructor(service = new MessageService()) {
    this.service = service;
  }

  async list(req, res, next) {
    try {
      const result = await this.service.list(
        req.params.channelId,
        req.user.uid,
        req.query,
      );
      return res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async get(req, res, next) {
    try {
      const message = await this.service.get(
        req.params.channelId,
        req.params.messageId,
        req.user.uid,
      );
      return res.json({ ok: true, message });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const message = await this.service.create(
        req.params.channelId,
        req.user.uid,
        req.body,
      );
      return res.status(201).json({ ok: true, message });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const message = await this.service.update(
        req.params.channelId,
        req.params.messageId,
        req.user.uid,
        req.body,
      );
      return res.json({ ok: true, message });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await this.service.remove(
        req.params.channelId,
        req.params.messageId,
        req.user.uid,
      );
      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async toggleReaction(req, res, next) {
    try {
      const reaction = await this.service.toggleReaction(
        req.params.channelId,
        req.params.messageId,
        req.user.uid,
        req.body.emoji,
      );
      return res.json({ ok: true, ...reaction });
    } catch (error) {
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const messages = await this.service.search(
        req.query.channelId,
        req.user.uid,
        req.query.query,
        req.query.limit,
      );
      return res.json({ ok: true, messages });
    } catch (error) {
      next(error);
    }
  }

  async events(req, res, next) {
    let unsubscribe;
    let heartbeat;
    try {
      await this.service.list(req.params.channelId, req.user.uid, {
        limit: 1,
        parentMessageId: null,
      });
      res.status(200);
      res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.flushHeaders();
      res.write("event: ready\ndata: {}\n\n");
      unsubscribe = await this.service.subscribe(
        req.params.channelId,
        req.user.uid,
        () => res.write("event: messages.updated\ndata: {}\n\n"),
        (error) => {
          logger.warn("Message stream ended with an error", {
            channelId: req.params.channelId,
            error: error?.message,
          });
          res.write("event: stream.error\ndata: {}\n\n");
          res.end();
        },
      );
      heartbeat = setInterval(() => {
        if (!res.writableEnded) res.write(": keep-alive\n\n");
      }, 25_000);
      res.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe?.();
      });
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      next(error);
    }
  }
}