import { describe, expect, it, vi } from "vitest";
import MessageController from "./message.controller.js";

function createResponse() {
  const closeHandlers = [];
  return {
    statusCode: 200,
    headers: {},
    chunks: [],
    headersSent: false,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    set(values) {
      Object.assign(this.headers, values);
      return this;
    },
    flushHeaders() {
      this.headersSent = true;
    },
    write(chunk) {
      this.chunks.push(chunk);
      return true;
    },
    json(value) {
      this.chunks.push(JSON.stringify(value));
      this.headersSent = true;
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
    },
    get writableEnded() {
      return this.ended;
    },
    on(event, handler) {
      if (event === "close") closeHandlers.push(handler);
      return this;
    },
    close() {
      this.ended = true;
      closeHandlers.forEach((handler) => handler());
    },
  };
}

function createService() {
  return {
    list: vi.fn(async () => ({ messages: [], nextBefore: null })),
    subscribe: vi.fn(async () => vi.fn()),
  };
}

const request = (uid) => ({
  params: { channelId: "channel-1" },
  user: { uid },
  query: {},
  body: {},
});

describe("MessageController live streams", () => {
  it("caps concurrent streams per user and frees slots when they close", async () => {
    const service = createService();
    const controller = new MessageController(service);
    const responses = [];

    for (let index = 0; index < 5; index += 1) {
      const res = createResponse();
      responses.push(res);
      await controller.events(request("member-1"), res, vi.fn());
      expect(res.statusCode).toBe(200);
      expect(res.chunks.join("")).toContain("event: ready");
    }

    const rejected = createResponse();
    await controller.events(request("member-1"), rejected, vi.fn());
    expect(rejected.statusCode).toBe(429);
    expect(JSON.parse(rejected.chunks.join(""))).toMatchObject({
      code: "TOO_MANY_STREAMS",
    });
    expect(service.subscribe).toHaveBeenCalledTimes(5);

    responses[0].close();

    const replacement = createResponse();
    responses.push(replacement);
    await controller.events(request("member-1"), replacement, vi.fn());
    expect(replacement.statusCode).toBe(200);

    responses.forEach((res) => res.close());
  });

  it("unsubscribes from Firestore listeners when the client disconnects", async () => {
    const unsubscribe = vi.fn();
    const service = {
      list: vi.fn(async () => ({ messages: [], nextBefore: null })),
      subscribe: vi.fn(async () => unsubscribe),
    };
    const controller = new MessageController(service);
    const res = createResponse();

    await controller.events(request("member-2"), res, vi.fn());
    await Promise.resolve();
    res.close();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("does not hold a slot when the channel access check fails", async () => {
    const service = {
      list: vi.fn(async () => {
        throw Object.assign(new Error("Channel not found"), { statusCode: 404 });
      }),
      subscribe: vi.fn(),
    };
    const controller = new MessageController(service);
    const next = vi.fn();

    await controller.events(request("member-1"), createResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(service.subscribe).not.toHaveBeenCalled();
  });
});
