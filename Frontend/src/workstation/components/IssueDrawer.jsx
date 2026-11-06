import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ExternalLink,
  Hash,
  Kanban,
  MessageSquare,
  Plus,
  Send,
  Target,
} from "lucide-react";
import { useWorkspace } from "../store/useWorkspace.js";
import { useUi } from "../store/useUi.js";
import { STATUSES, STATUS_LABEL, PRIORITIES } from "../data/seed.js";
import {
  Avatar,
  Drawer,
  Meter,
  PriorityMark,
  RichText,
  Tag,
  TypeIcon,
} from "./ui.jsx";
import { relativeTime, shortDate, dueMeta } from "../lib/format.js";

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span className="ws-field-label ws-label">{label}</span>
      {children}
    </label>
  );
}

function IssueDetail({ issue }) {
  const { state, memberById, updateIssue, addComment, toggleCheck, addCheck } =
    useWorkspace();
  const { closeIssue } = useUi();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [checkDraft, setCheckDraft] = useState("");
  const [description, setDescription] = useState(issue.description || "");

  const assignee = issue.assigneeId ? memberById[issue.assigneeId] : null;
  const reporter = issue.reporterId ? memberById[issue.reporterId] : null;

  const board = useMemo(
    () => state.boards.find((item) => item.projectId === issue.projectId),
    [state.boards, issue.projectId],
  );

  const channel = useMemo(() => {
    if (!issue.slackChannelId) return null;
    return state.channels.find((item) => item.id === issue.slackChannelId) || null;
  }, [state.channels, issue.slackChannelId]);

  const slackThread = useMemo(() => {
    if (!channel || !issue.slackMessageId) return null;
    return channel.messages.find((message) => message.id === issue.slackMessageId) || null;
  }, [channel, issue.slackMessageId]);

  const doneChecks = issue.checklist.filter((item) => item.done).length;
  const due = dueMeta(issue.dueAt);
  const sprint = state.sprints.find((item) => item.id === issue.sprintId);

  const setStatus = (status) => updateIssue(issue.id, { status });

  const submitComment = (event) => {
    event.preventDefault();
    const body = comment.trim();
    if (!body) return;
    addComment(issue.id, body);
    setComment("");
  };

  return (
    <Drawer
      open
      onClose={closeIssue}
      wide
      title={
        <span className="ws-row" style={{ gap: 8 }}>
          <TypeIcon type={issue.type} />
          <span>{issue.id}</span>
        </span>
      }
      subtitle={`${issue.type} · reported by ${reporter?.name || "unknown"} · ${relativeTime(issue.createdAt)}`}
      actions={
        board ? (
          <button
            type="button"
            className="ws-btn ws-btn--outline ws-btn--sm"
            onClick={() => {
              closeIssue();
              navigate(`/boards?board=${board.id}`);
            }}
          >
            <Kanban size={12} /> Board
          </button>
        ) : null
      }
      footer={
        <div className="ws-row" style={{ gap: 8, flexWrap: "wrap" }}>
          <span className="ws-label">Workflow</span>
          {STATUSES.map((status) => (
            <button
              key={status.id}
              type="button"
              className="ws-chip"
              data-active={issue.status === status.id}
              onClick={() => setStatus(status.id)}
            >
              {issue.status === status.id ? <Check size={10} /> : <span className="ws-dot" />}
              {status.label}
            </button>
          ))}
        </div>
      }
    >
      <h2
        className="ws-display"
        style={{ fontSize: 22, letterSpacing: "-0.01em", marginBottom: 12 }}
      >
        {issue.title}
      </h2>

      <div className="ws-row ws-row--wrap" style={{ gap: 6, marginBottom: 18 }}>
        <Tag tone={issue.status === "done" ? "ok" : "ember"}>{STATUS_LABEL[issue.status]}</Tag>
        <Tag tone={issue.priority === "critical" ? "ember" : issue.priority === "high" ? "warn" : "neutral"}>
          {PRIORITIES[issue.priority]?.label} priority
        </Tag>
        {issue.labels.map((label) => (
          <Tag key={label} tone={label === "auth" ? "ember" : "neutral"}>
            {label}
          </Tag>
        ))}
        {due ? <Tag tone={due.tone}>{due.text}</Tag> : null}
      </div>

      <div className="ws-panel" style={{ padding: 14, marginBottom: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          <Field label="Assignee">
            <select
              className="ws-select"
              value={issue.assigneeId || ""}
              onChange={(event) =>
                updateIssue(issue.id, { assigneeId: event.target.value || null })
              }
            >
              <option value="">Unassigned</option>
              {state.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              className="ws-select"
              value={issue.priority}
              onChange={(event) => updateIssue(issue.id, { priority: event.target.value })}
            >
              {Object.entries(PRIORITIES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sprint">
            <select
              className="ws-select"
              value={issue.sprintId || ""}
              onChange={(event) =>
                updateIssue(issue.id, { sprintId: event.target.value || null })
              }
            >
              <option value="">Backlog</option>
              {state.sprints.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Points">
            <input
              type="number"
              min="0"
              max="21"
              className="ws-input"
              value={issue.points}
              onChange={(event) =>
                updateIssue(issue.id, { points: Number(event.target.value) || 0 })
              }
            />
          </Field>
        </div>
      </div>

      <section style={{ marginBottom: 20 }}>
        <div className="ws-row" style={{ marginBottom: 8 }}>
          <span className="ws-label">Description</span>
          <span className="ws-spacer" />
          {description !== issue.description ? (
            <button
              type="button"
              className="ws-btn ws-btn--ghost ws-btn--sm"
              onClick={() => updateIssue(issue.id, { description })}
            >
              Save
            </button>
          ) : null}
        </div>
        <textarea
          className="ws-textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onBlur={() => {
            if (description !== issue.description) {
              updateIssue(issue.id, { description });
            }
          }}
          placeholder="Add context, reproduction steps, or acceptance criteria…"
          rows={5}
        />
      </section>

      <section style={{ marginBottom: 20 }}>
        <div className="ws-row" style={{ marginBottom: 8 }}>
          <span className="ws-label">Checklist</span>
          <span className="ws-spacer" />
          <span className="ws-mono" style={{ fontSize: 10, color: "var(--vg-text-3)" }}>
            {doneChecks}/{issue.checklist.length}
          </span>
        </div>
        <Meter
          value={doneChecks}
          total={issue.checklist.length || 1}
          thin
          tone={doneChecks === issue.checklist.length ? "ok" : "ember"}
          label="Checklist progress"
        />
        <div style={{ marginTop: 10, display: "grid", gap: 2 }}>
          {issue.checklist.map((item) => (
            <label
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "6px 6px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11.5,
                color: item.done ? "var(--vg-text-3)" : "var(--vg-text-2)",
              }}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleCheck(issue.id, item.id)}
                style={{ accentColor: "#ff4433", width: 13, height: 13 }}
              />
              <span style={{ textDecoration: item.done ? "line-through" : "none" }}>
                {item.text}
              </span>
            </label>
          ))}
        </div>
        <form
          className="ws-row"
          style={{ marginTop: 8, gap: 6 }}
          onSubmit={(event) => {
            event.preventDefault();
            const text = checkDraft.trim();
            if (!text) return;
            addCheck(issue.id, text);
            setCheckDraft("");
          }}
        >
          <input
            className="ws-input"
            placeholder="Add a checklist item"
            value={checkDraft}
            onChange={(event) => setCheckDraft(event.target.value)}
          />
          <button type="submit" className="ws-btn ws-btn--outline" aria-label="Add checklist item">
            <Plus size={13} />
          </button>
        </form>
      </section>

      {channel || sprint ? (
        <section style={{ marginBottom: 20 }}>
          <span className="ws-label" style={{ display: "block", marginBottom: 8 }}>
            Linked across modules
          </span>
          <div style={{ display: "grid", gap: 7 }}>
            {channel ? (
              <button
                type="button"
                className="ws-panel ws-panel--hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  background: "#08080a",
                  color: "inherit",
                }}
                onClick={() => {
                  closeIssue();
                  navigate(`/channels?c=${channel.id}`);
                }}
              >
                <Hash size={14} style={{ color: "var(--vg-info)" }} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--vg-text)" }}>
                    #{channel.name}
                  </span>
                  <span style={{ display: "block", fontSize: 10, color: "var(--vg-text-3)" }}>
                    {slackThread
                      ? `“${slackThread.body.slice(0, 62)}…”`
                      : "Discussion thread linked to this issue"}
                  </span>
                </span>
                <ArrowRight size={13} style={{ color: "var(--vg-text-3)" }} />
              </button>
            ) : null}
            {board ? (
              <button
                type="button"
                className="ws-panel ws-panel--hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  background: "#08080a",
                  color: "inherit",
                }}
                onClick={() => {
                  closeIssue();
                  navigate(`/boards?board=${board.id}`);
                }}
              >
                <Kanban size={14} style={{ color: "var(--vg-ok)" }} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--vg-text)" }}>
                    {board.name}
                  </span>
                  <span style={{ display: "block", fontSize: 10, color: "var(--vg-text-3)" }}>
                    Card position follows the workflow: {STATUS_LABEL[issue.status]}
                  </span>
                </span>
                <ExternalLink size={13} style={{ color: "var(--vg-text-3)" }} />
              </button>
            ) : null}
            {sprint ? (
              <div
                className="ws-panel"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#08080a" }}
              >
                <Target size={14} style={{ color: "var(--vg-ember)" }} />
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 11.5 }}>{sprint.name}</span>
                  <span style={{ display: "block", fontSize: 10, color: "var(--vg-text-3)" }}>
                    {shortDate(sprint.start)} → {shortDate(sprint.end)}
                  </span>
                </span>
                <Tag tone="info">{sprint.status}</Tag>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section>
        <div className="ws-row" style={{ marginBottom: 10 }}>
          <span className="ws-label">
            <MessageSquare size={10} style={{ verticalAlign: "-1px", marginRight: 5 }} />
            Comments
          </span>
          <span className="ws-spacer" />
          <span className="ws-mono" style={{ fontSize: 10, color: "var(--vg-text-3)" }}>
            {issue.comments.length}
          </span>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {issue.comments.map((item) => {
            const author = memberById[item.authorId];
            return (
              <div key={item.id} className="ws-row" style={{ alignItems: "flex-start", gap: 9 }}>
                <Avatar member={author} size="sm" presence={false} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ws-row" style={{ gap: 8 }}>
                    <span style={{ fontSize: 11.5, color: "#fff" }}>{author?.name}</span>
                    <span style={{ fontSize: 9.5, color: "var(--vg-text-4)" }}>
                      {relativeTime(item.at)}
                    </span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--vg-text-2)", lineHeight: 1.6 }}>
                    <RichText text={item.body} />
                  </p>
                </div>
              </div>
            );
          })}
          {!issue.comments.length ? (
            <p style={{ margin: 0, fontSize: 11, color: "var(--vg-text-4)" }}>
              No comments yet — start the thread.
            </p>
          ) : null}
        </div>

        <form onSubmit={submitComment} style={{ marginTop: 12 }}>
          <div className="ws-composer__box">
            <textarea
              placeholder="Leave a comment. Mention teammates with @handle…"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              style={{ minHeight: 62 }}
            />
            <div className="ws-composer__bar">
              <span style={{ fontSize: 9.5, color: "var(--vg-text-4)", paddingLeft: 6 }}>
                Syncing to the board and issue tracker
              </span>
              <span className="ws-spacer" />
              <button type="submit" className="ws-btn ws-btn--primary ws-btn--sm" disabled={!comment.trim()}>
                <Send size={11} /> Comment
              </button>
            </div>
          </div>
        </form>

        <div
          className="ws-row"
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid var(--vg-line)",
            fontSize: 10,
            color: "var(--vg-text-4)",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <span className="ws-row" style={{ gap: 5 }}>
            <Avatar member={assignee} size="sm" presence={false} />
            {assignee ? assignee.name : "Unassigned"}
          </span>
          <span className="ws-row" style={{ gap: 5 }}>
            <CalendarDays size={11} />
            {issue.dueAt ? shortDate(issue.dueAt) : "No due date"}
          </span>
          <span className="ws-row" style={{ gap: 5 }}>
            <PriorityMark priority={issue.priority} />
            {issue.priority}
          </span>
          <span className="ws-spacer" />
          <span>updated {relativeTime(issue.updatedAt)}</span>
        </div>
      </section>
    </Drawer>
  );
}

export function IssueDrawer() {
  const { state } = useWorkspace();
  const { issueId } = useUi();
  const issue = state.issues.find((item) => item.id === issueId) || null;
  if (!issue) return null;
  return <IssueDetail key={issue.id} issue={issue} />;
}

export default IssueDrawer;
