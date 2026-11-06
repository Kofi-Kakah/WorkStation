const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact relative time used across the workspace chrome. */
export function relativeTime(iso, now = Date.now()) {
  if (!iso) return "—";
  const value = new Date(iso).getTime();
  if (Number.isNaN(value)) return "—";
  const delta = now - value;
  if (delta < 45_000) return "just now";
  if (delta < HOUR) return `${Math.round(delta / MINUTE)}m ago`;
  if (delta < DAY) return `${Math.round(delta / HOUR)}h ago`;
  if (delta < 7 * DAY) return `${Math.round(delta / DAY)}d ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function timeOfDay(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function dayLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Due-date chip copy + tone. */
export function dueMeta(iso, now = Date.now()) {
  if (!iso) return null;
  const value = new Date(iso).getTime();
  const delta = value - now;
  const days = Math.round(delta / DAY);
  if (delta < 0) {
    return { text: `${Math.abs(days) || 1}d overdue`, tone: "ember" };
  }
  if (days === 0) return { text: "Due today", tone: "warn" };
  if (days === 1) return { text: "Due tomorrow", tone: "warn" };
  if (days <= 4) return { text: `${days}d left`, tone: "info" };
  return { text: shortDate(iso), tone: "neutral" };
}

export function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function firstName(name = "") {
  return name.split(/\s+/)[0];
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Flatten replies so search and activity can reason about them. */
export function allMessages(channel) {
  if (!channel) return [];
  return channel.messages.flatMap((message) => [message, ...message.replies]);
}

export function searchWorkspace(state, query) {
  const term = query.trim().toLowerCase();
  if (!term) return { issues: [], channels: [], boards: [], members: [] };
  const matches = (text) => String(text || "").toLowerCase().includes(term);
  return {
    issues: state.issues
      .filter((issue) => matches(issue.title) || matches(issue.id))
      .slice(0, 6),
    channels: state.channels.filter(
      (channel) => matches(channel.name) || matches(channel.topic),
    ),
    boards: state.boards.filter(
      (board) => matches(board.name) || matches(board.description),
    ),
    members: state.members.filter(
      (member) => matches(member.name) || matches(member.handle),
    ),
  };
}
