import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import seedState from "../data/seed.js";
import WorkspaceContext from "./workspaceContext.js";

const STORAGE_KEY = "workstation.demo.v2";

const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

function loadInitialState() {
  if (typeof window === "undefined") return seedState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== seedState.version) return seedState;
    return parsed;
  } catch {
    return seedState;
  }
}

const nowIso = () => new Date().toISOString();

function withActivity(state, entry) {
  const activity = {
    id: uid("act"),
    at: nowIso(),
    ...entry,
  };
  return { ...state, activity: [activity, ...state.activity].slice(0, 120) };
}

function reducer(state, action) {
  switch (action.type) {
    case "issue/create": {
      const project = state.projects.find((p) => p.id === action.payload.projectId) ||
        state.projects[0];
      const numbers = state.issues
        .filter((issue) => issue.projectId === project.id)
        .map((issue) => Number(issue.id.split("-")[1]) || 0);
      const nextNumber = Math.max(100, ...numbers) + 1;
      const issue = {
        id: `${project.key}-${nextNumber}`,
        projectId: project.id,
        sprintId: action.payload.sprintId || null,
        type: action.payload.type || "task",
        title: action.payload.title?.trim() || "Untitled issue",
        description: action.payload.description || "",
        status: action.payload.status || "backlog",
        priority: action.payload.priority || "medium",
        points: Number(action.payload.points) || 0,
        assigneeId: action.payload.assigneeId || null,
        reporterId: state.meId,
        labels: action.payload.labels || [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        dueAt: action.payload.dueAt || null,
        checklist: action.payload.checklist || [],
        comments: [],
        slackChannelId: action.payload.slackChannelId || null,
        slackMessageId: action.payload.slackMessageId || null,
      };
      const next = {
        ...state,
        issues: [issue, ...state.issues],
      };
      const withLog = withActivity(next, {
        module: "jira",
        actorId: state.meId,
        verb: "created",
        target: issue.id,
        detail: issue.title,
      });
      return withLog;
    }

    case "issue/update": {
      const { id, patch } = action.payload;
      let changed = null;
      const issues = state.issues.map((issue) => {
        if (issue.id !== id) return issue;
        changed = { ...issue, ...patch, updatedAt: nowIso() };
        return changed;
      });
      const next = { ...state, issues };
      if (!changed) return state;
      if (patch.status) {
        return withActivity(next, {
          module: "jira",
          actorId: state.meId,
          verb: "moved",
          target: id,
          detail: `to ${issueStatusLabel(state, patch.status)} · board synced`,
        });
      }
      return next;
    }

    case "issue/comment": {
      const { id, body } = action.payload;
      const comment = {
        id: uid("c"),
        authorId: state.meId,
        body,
        at: nowIso(),
      };
      const issues = state.issues.map((issue) =>
        issue.id === id
          ? { ...issue, comments: [...issue.comments, comment], updatedAt: nowIso() }
          : issue,
      );
      return withActivity(
        { ...state, issues },
        {
          module: "jira",
          actorId: state.meId,
          verb: "commented on",
          target: id,
          detail: body.slice(0, 70),
        },
      );
    }

    case "issue/toggle-check": {
      const { id, checkId } = action.payload;
      const issues = state.issues.map((issue) =>
        issue.id === id
          ? {
              ...issue,
              updatedAt: nowIso(),
              checklist: issue.checklist.map((item) =>
                item.id === checkId ? { ...item, done: !item.done } : item,
              ),
            }
          : issue,
      );
      return { ...state, issues };
    }

    case "issue/add-check": {
      const { id, text } = action.payload;
      const issues = state.issues.map((issue) =>
        issue.id === id
          ? {
              ...issue,
              checklist: [
                ...issue.checklist,
                { id: uid("chk"), text, done: false },
              ],
            }
          : issue,
      );
      return { ...state, issues };
    }

    case "board/add-list": {
      const { boardId, title } = action.payload;
      const boards = state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              lists: [
                ...board.lists,
                {
                  id: uid("list"),
                  title,
                  status: "backlog",
                  wip: null,
                },
              ],
            }
          : board,
      );
      return { ...state, boards };
    }

    case "board/move-issue": {
      const { issueId, status, beforeId } = action.payload;
      if (!status) return state;
      const issues = state.issues.map((issue) =>
        issue.id === issueId
          ? { ...issue, status, updatedAt: nowIso() }
          : issue,
      );
      // Keep a stable manual order per status on the board.
      const order = { ...(state.cardOrder || {}) };
      const bucket = (order[status] || []).filter((id) => id !== issueId);
      const index = beforeId ? bucket.indexOf(beforeId) : -1;
      if (index >= 0) bucket.splice(index, 0, issueId);
      else bucket.unshift(issueId);
      order[status] = bucket;
      const next = { ...state, issues, cardOrder: order };
      return withActivity(next, {
        module: "trello",
        actorId: state.meId,
        verb: "moved",
        target: issueId,
        detail: `to ${issueStatusLabel(state, status)} — issue synced`,
      });
    }

    case "message/send": {
      const { channelId, body, parentId } = action.payload;
      const message = {
        id: uid("msg"),
        authorId: state.meId,
        body,
        at: nowIso(),
        reactions: [],
        replies: [],
      };
      const update = (channel) => {
        if (parentId) {
          return {
            ...channel,
            messages: channel.messages.map((msg) =>
              msg.id === parentId
                ? { ...msg, replies: [...msg.replies, message] }
                : msg,
            ),
          };
        }
        return { ...channel, messages: [...channel.messages, message] };
      };
      const channels = state.channels.map((channel) =>
        channel.id === channelId ? update(channel) : channel,
      );
      const dms = state.dms.map((dm) => (dm.id === channelId ? update(dm) : dm));
      const target = [...state.channels, ...state.dms].find(
        (channel) => channel.id === channelId,
      );
      return withActivity(
        { ...state, channels, dms },
        {
          module: "slack",
          actorId: state.meId,
          verb: "posted in",
          target: target?.name ? `#${target.name}` : "direct message",
          detail: body.slice(0, 70),
        },
      );
    }

    case "message/react": {
      const { channelId, messageId, emoji, parentId } = action.payload;
      const toggle = (msg) => {
        if (msg.id !== messageId) return msg;
        const existing = msg.reactions.find((r) => r.emoji === emoji);
        let reactions;
        if (!existing) {
          reactions = [...msg.reactions, { emoji, memberIds: [state.meId] }];
        } else if (existing.memberIds.includes(state.meId)) {
          reactions = msg.reactions
            .map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    memberIds: r.memberIds.filter((id) => id !== state.meId),
                  }
                : r,
            )
            .filter((r) => r.memberIds.length > 0);
        } else {
          reactions = msg.reactions.map((r) =>
            r.emoji === emoji
              ? { ...r, memberIds: [...r.memberIds, state.meId] }
              : r,
          );
        }
        return { ...msg, reactions };
      };
      const updateChannel = (channel) => {
        if (channel.id !== channelId) return channel;
        if (parentId) {
          return {
            ...channel,
            messages: channel.messages.map((msg) =>
              msg.id === parentId
                ? { ...msg, replies: msg.replies.map(toggle) }
                : msg,
            ),
          };
        }
        return { ...channel, messages: channel.messages.map(toggle) };
      };
      return {
        ...state,
        channels: state.channels.map(updateChannel),
        dms: state.dms.map(updateChannel),
      };
    }

    case "message/mark-read": {
      const { channelId } = action.payload;
      return {
        ...state,
        channels: state.channels.map((channel) =>
          channel.id === channelId ? { ...channel, unread: 0 } : channel,
        ),
        dms: state.dms.map((dm) =>
          dm.id === channelId ? { ...dm, unread: 0 } : dm,
        ),
      };
    }

    case "notifications/read": {
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    }

    case "integration/toggle": {
      const { id } = action.payload;
      const integrations = state.integrations.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              status:
                integration.status === "connected" ? "available" : "connected",
              syncedAt: integration.status === "connected" ? null : nowIso(),
            }
          : integration,
      );
      return { ...state, integrations };
    }

    case "reset":
      return seedState;

    default:
      return state;
  }
}

function issueStatusLabel(state, status) {
  const labels = {
    backlog: "Backlog",
    ready: "Ready",
    in_progress: "In progress",
    in_review: "In review",
    done: "Done",
  };
  return labels[status] || status;
}

/**
 * Shared workspace state for the demo experience. Persists to localStorage so
 * board moves, new issues, and chat messages survive a reload.
 */
export function WorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be full or blocked; the app still works in-memory.
    }
  }, [state]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (toast) => {
      const id = uid("toast");
      setToasts((current) => [...current, { id, ...toast }].slice(-3));
      const timer = setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
        timers.current.delete(id);
      }, 4600);
      timers.current.set(id, timer);
    },
    [],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  const value = useMemo(() => {
    const memberById = Object.fromEntries(
      state.members.map((member) => [member.id, member]),
    );
    const issueById = Object.fromEntries(
      state.issues.map((issue) => [issue.id, issue]),
    );
    const me = memberById[state.meId] || state.members[0];

    return {
      state,
      me,
      memberById,
      issueById,
      toasts,
      pushToast,
      dismissToast,

      createIssue: (payload) => {
        dispatch({ type: "issue/create", payload });
        const project = state.projects.find((p) => p.id === payload.projectId);
        pushToast({
          title: "Issue created",
          body: `${project?.name || "Project"} · ${payload.title || "Untitled"}`,
        });
      },
      updateIssue: (id, patch) => dispatch({ type: "issue/update", payload: { id, patch } }),
      moveIssue: (issueId, status, beforeId) => {
        dispatch({ type: "board/move-issue", payload: { issueId, status, beforeId } });
        pushToast({
          title: "Board synced",
          body: `${issueId} → ${issueStatusLabel(state, status)}`,
        });
      },
      addComment: (id, body) =>
        dispatch({ type: "issue/comment", payload: { id, body } }),
      toggleCheck: (id, checkId) =>
        dispatch({ type: "issue/toggle-check", payload: { id, checkId } }),
      addCheck: (id, text) =>
        dispatch({ type: "issue/add-check", payload: { id, text } }),
      addList: (boardId, title) =>
        dispatch({ type: "board/add-list", payload: { boardId, title } }),

      sendMessage: (channelId, body, options = {}) =>
        dispatch({
          type: "message/send",
          payload: { channelId, body, parentId: options.parentId },
        }),
      react: (channelId, messageId, emoji, parentId) =>
        dispatch({
          type: "message/react",
          payload: { channelId, messageId, emoji, parentId },
        }),
      markChannelRead: (channelId) =>
        dispatch({ type: "message/mark-read", payload: { channelId } }),
      readNotifications: () => dispatch({ type: "notifications/read" }),
      toggleIntegration: (id) =>
        dispatch({ type: "integration/toggle", payload: { id } }),

      /** Turn a Slack message into a Jira issue, then post a system reply. */
      createIssueFromMessage: (channelId, messageId) => {
        const channel = [...state.channels, ...state.dms].find(
          (item) => item.id === channelId,
        );
        const message = channel?.messages.find((m) => m.id === messageId);
        if (!message) return null;
        const project = state.projects[0];
        const numbers = state.issues
          .filter((issue) => issue.projectId === project.id)
          .map((issue) => Number(issue.id.split("-")[1]) || 0);
        const key = `${project.key}-${Math.max(100, ...numbers) + 1}`;
        const author = memberById[message.authorId];
        dispatch({
          type: "issue/create",
          payload: {
            projectId: project.id,
            title: message.body.split("\n")[0].slice(0, 90),
            description: `Captured from #${channel.name || "direct message"} by ${author?.name || "a teammate"}.\n\n${message.body}`,
            type: "task",
            priority: "medium",
            status: "backlog",
            sprintId: null,
            slackChannelId: channelId,
            slackMessageId: messageId,
          },
        });
        dispatch({
          type: "message/send",
          payload: {
            channelId,
            body: `Captured as ${key} → ${project.name}. Tracking from the Backlog.`,
          },
        });
        pushToast({
          title: "Issue captured from Slack",
          body: `${key} created and linked to this message`,
        });
        return key;
      },

      resetDemo: () => {
        dispatch({ type: "reset" });
        pushToast({
          title: "Demo workspace reset",
          body: "Issues, boards, and channels are back to seed state.",
        });
      },
    };
  }, [state, toasts, pushToast, dismissToast]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceProvider;
