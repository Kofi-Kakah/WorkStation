import MessageService from "./message.service.js";
import logger from "../../shared/utils/logger.js";

const MAX_STREAMS_PER_USER = 5;
const activeStreams = new Map();

function acquireStreamSlot(uid) {
  const current = activeStreams.get(uid) || 0;
  if (current >= MAX_STREAMS_PER_USER) return null;
  activeStreams.set(uid, current + 1);
  return () => {
    const remaining = (activeStreams.get(uid) || 1) - 1;
    if (remaining <= 0) activeStreams.delete(uid);
    else activeStreams.set(uid, remaining);
  };
}

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
    let releaseSlot = null;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      releaseSlot?.();
    };
    try {
      await this.service.list(req.params.channelId, req.user.uid, {
        limit: 1,
        parentMessageId: null,
      });
      releaseSlot = acquireStreamSlot(req.user.uid);
      if (!releaseSlot) {
        return res.status(429).json({
          error: "Too many open message streams, close another tab first",
          code: "TOO_MANY_STREAMS",
        });
      }
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
        release();
      });
    } catch (error) {
      release();
      if (res.headersSent) {
        res.end();
        return;
      }
      next(error);
    }
  }
}