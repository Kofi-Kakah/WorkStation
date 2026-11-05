import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useChannelEvents from "./useChannelEvents.js";

const firebase = vi.hoisted(() => ({
  getIdToken: vi.fn(async () => "firebase-id-token"),
}));

vi.mock("../../lib/firebase.js", () => ({
  auth: {
    get currentUser() {
      return { getIdToken: firebase.getIdToken };
    },
  },
}));

function Harness({ channelId = "channel-1", onMessagesUpdated = () => {} }) {
  const status = useChannelEvents(channelId, onMessagesUpdated);
  return <span data-testid="status">{status}</span>;
}

function liveStream() {
  const encoder = new TextEncoder();
  let controller;
  const body = new ReadableStream({
    start(streamController) {
      controller = streamController;
    },
  });
  return {
    body,
    push(text) {
      controller.enqueue(encoder.encode(text));
    },
  };
}

describe("useChannelEvents", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it("reports live status and refreshes messages from the SSE stream", async () => {
    const stream = liveStream();
    globalThis.fetch.mockResolvedValue({
      ok: true,
      body: stream.body,
    });
    const onMessagesUpdated = vi.fn();

    render(<Harness onMessagesUpdated={onMessagesUpdated} />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/v1/channels/channel-1/events",
        expect.objectContaining({
          headers: { Authorization: "Bearer firebase-id-token" },
        }),
      );
    });
    expect(screen.getByTestId("status")).toHaveTextContent("connecting");

    await act(async () => {
      stream.push("event: ready\ndata: {}\n\n");
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("live");
    });

    await act(async () => {
      stream.push("event: messages.updated\ndata: {}\n\n");
      await Promise.resolve();
    });

    expect(onMessagesUpdated).toHaveBeenCalledTimes(1);
  });

  it("reports a reconnecting state when the stream cannot be opened", async () => {
    globalThis.fetch.mockRejectedValue(new Error("network unavailable"));

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("reconnecting");
    });
  });

  it("treats a non-success response as a connection failure", async () => {
    globalThis.fetch.mockResolvedValue({ ok: false, status: 404 });

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("reconnecting");
    });
  });

  it("stays offline and does not connect without a channel", async () => {
    render(<Harness channelId={null} />);

    expect(screen.getByTestId("status")).toHaveTextContent("offline");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
