import { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useWorkspace } from "../store/useWorkspace.js";
import { useUi } from "../store/useUi.js";
import { ISSUE_TYPES, LABELS, PRIORITIES, STATUSES } from "../data/seed.js";
import { Modal, TypeIcon } from "./ui.jsx";

const EMPTY = {
  title: "",
  description: "",
  projectId: "orb",
  type: "task",
  priority: "medium",
  status: "backlog",
  assigneeId: "",
  sprintId: "",
  points: 3,
  labels: [],
  dueAt: "",
};

function IssueForm({ preset, onClose }) {
  const { state, createIssue } = useWorkspace();
  const [form, setForm] = useState(() => {
    const projectId = preset.projectId || EMPTY.projectId;
    return {
      ...EMPTY,
      ...preset,
      sprintId: preset.sprintId ?? (projectId === "orb" ? "sprint-24" : ""),
      labels: preset.labels || [],
    };
  });
  const [error, setError] = useState("");

  const project = useMemo(
    () => state.projects.find((item) => item.id === form.projectId) || state.projects[0],
    [state.projects, form.projectId],
  );

  const update = (patch) =>
    setForm((current) => {
      const next = { ...current, ...patch };
      if (patch.projectId && patch.projectId !== current.projectId) {
        const sprint = state.sprints.find((item) => item.id === next.sprintId);
        if (sprint && sprint.projectId !== patch.projectId) next.sprintId = "";
      }
      return next;
    });

  const toggleLabel = (label) => {
    setForm((current) => ({
      ...current,
      labels: current.labels.includes(label)
        ? current.labels.filter((item) => item !== label)
        : [...current.labels, label],
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Give the issue a title so the team can find it.");
      return;
    }
    createIssue({
      ...form,
      title: form.title.trim(),
      points: Number(form.points) || 0,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
      assigneeId: form.assigneeId || null,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Create issue"
      subtitle={`${project?.name} · ${project?.key} — the canonical record for boards and chat`}
      actions={
        <span className="ws-tag ws-tag--ember">
          <Sparkles size={9} /> board sync on
        </span>
      }
      footer={
        <>
          <span className="ws-faint" style={{ fontSize: 10 }}>
            Issues are the single source of truth across all three modules.
          </span>
          <span className="ws-spacer" />
          <button type="button" className="ws-btn ws-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="create-issue-form" className="ws-btn ws-btn--primary">
            <Plus size={13} /> Create issue
          </button>
        </>
      }
    >
      <form id="create-issue-form" onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <div>
          <label className="ws-field-label ws-label" htmlFor="issue-title">
            Title
          </label>
          <input
            id="issue-title"
            className="ws-input"
            autoFocus
            placeholder="e.g. Channel unread badges drift after reconnect"
            value={form.title}
            onChange={(event) => {
              update({ title: event.target.value });
              if (error) setError("");
            }}
            aria-invalid={Boolean(error)}
          />
          {error ? (
            <p style={{ margin: "6px 0 0", fontSize: 10.5, color: "var(--vg-ember)" }}>{error}</p>
          ) : null}
        </div>

        <div>
          <label className="ws-field-label ws-label" htmlFor="issue-description">
            Description
          </label>
          <textarea
            id="issue-description"
            className="ws-textarea"
            placeholder="Context, reproduction steps, acceptance criteria…"
            value={form.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <label style={{ display: "block" }}>
            <span className="ws-field-label ws-label">Project</span>
            <select
              className="ws-select"
              value={form.projectId}
              onChange={(event) => update({ projectId: event.target.value })}
            >
              {state.projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.key})
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="ws-field-label ws-label">Type</span>
            <div className="ws-row" style={{ gap: 4 }}>
              {Object.entries(ISSUE_TYPES).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  className="ws-chip"
                  data-active={form.type === key}
                  onClick={() => update({ type: key })}
                  title={value.label}
                  aria-label={value.label}
                >
                  <TypeIcon type={key} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <label>
            <span className="ws-field-label ws-label">Priority</span>
            <select
              className="ws-select"
              value={form.priority}
              onChange={(event) => update({ priority: event.target.value })}
            >
              {Object.entries(PRIORITIES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="ws-field-label ws-label">Status</span>
            <select
              className="ws-select"
              value={form.status}
              onChange={(event) => update({ status: event.target.value })}
            >
              {STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="ws-field-label ws-label">Points</span>
            <input
              type="number"
              min="0"
              max="21"
              className="ws-input"
              value={form.points}
              onChange={(event) => update({ points: event.target.value })}
            />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <label>
            <span className="ws-field-label ws-label">Assignee</span>
            <select
              className="ws-select"
              value={form.assigneeId}
              onChange={(event) => update({ assigneeId: event.target.value })}
            >
              <option value="">Unassigned</option>
              {state.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="ws-field-label ws-label">Sprint</span>
            <select
              className="ws-select"
              value={form.sprintId || ""}
              onChange={(event) => update({ sprintId: event.target.value })}
            >
              <option value="">Backlog</option>
              {state.sprints
                .filter((sprint) => sprint.status !== "completed")
                .map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span className="ws-field-label ws-label">Due</span>
            <input
              type="date"
              className="ws-input"
              value={form.dueAt}
              onChange={(event) => update({ dueAt: event.target.value })}
            />
          </label>
        </div>

        <div>
          <span className="ws-field-label ws-label">Labels</span>
          <div className="ws-row ws-row--wrap" style={{ gap: 5 }}>
            {Object.keys(LABELS).map((label) => (
              <button
                key={label}
                type="button"
                className="ws-chip"
                data-active={form.labels.includes(label)}
                onClick={() => toggleLabel(label)}
                style={{ height: 23, fontSize: 9.5 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 10, color: "var(--vg-text-4)", lineHeight: 1.6 }}>
          A card on a board is just this issue placed in a workflow column — moving one keeps the
          other in sync.
        </p>
      </form>
    </Modal>
  );
}

export function CreateIssueModal() {
  const { createOpen, createPreset, closeCreateIssue } = useUi();
  if (!createOpen) return null;
  return <IssueForm preset={createPreset} onClose={closeCreateIssue} />;
}

export default CreateIssueModal;
