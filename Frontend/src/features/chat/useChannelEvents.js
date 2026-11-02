import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase.js";

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

export function useChannelEvents(channelId, onMessagesUpdated) {
  const [connection, setConnection] = useState({
    channelId: null,
    status: "offline",
  });
  const status =
    connection.channelId === channelId
      ? connection.status
      : channelId
        ? "connecting"
        : "offline";

  useEffect(() => {
    if (!channelId) return undefined;

    const controller = new AbortController();
    let retryTimer;
    let stopped = false;

    const connect = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error("Authentication is required for live updates");
        setConnection({ channelId, status: "connecting" });
        const response = await fetch(
          `${API_BASE}/channels/${encodeURIComponent(channelId)}/events`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        );
        if (!response.ok || !response.body) {
          throw new Error(`Live updates returned HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split(/\r?\n\r?\n/);
          buffer = blocks.pop() || "";
          for (const block of blocks) {
            const eventName = block
              .split(/\r?\n/)
              .find((line) => line.startsWith("event:"))
              ?.slice(6)
              .trim();
            if (eventName === "ready") {
              setConnection({ channelId, status: "live" });
            }
            if (eventName === "messages.updated") onMessagesUpdated();
            if (eventName === "stream.error") {
              throw new Error("The live message stream ended unexpectedly");
            }
          }
        }
        if (!stopped) throw new Error("The live message stream disconnected");
      } catch (error) {
        if (stopped || error.name === "AbortError") return;
        setConnection({ channelId, status: "reconnecting" });
        retryTimer = window.setTimeout(connect, 3000);
      }
    };

    connect();
    return () => {
      stopped = true;
      controller.abort();
      window.clearTimeout(retryTimer);
    };
  }, [channelId, onMessagesUpdated]);

  return status;
}

export default useChannelEvents;
