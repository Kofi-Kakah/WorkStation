import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Kanban,
  ListFilter,
  Plus,
  Search,
  Target,
  X,
} from "lucide-react";
import { useWorkspace } from "../store/useWorkspace.js";
import { useUi } from "../store/useUi.js";
import { ISSUE_TYPES, PRIORITIES, STATUSES } from "../data/seed.js";
import {
  Avatar,
  EmptyState,
  Meter,
  PriorityMark,
  Tag,
  TypeIcon,
} from "../components/ui.jsx";
import { relativeTime, shortDate } from "../lib/format.js";

const STATUS_TONE = {
  backlog: "neutral",
  ready: "info",
  in_progress: "ember",
  in_review: "warn",
  done: "ok",
};

export function IssuesPage() {
  const { state, memberById } = useWorkspace();
  const { openIssue, openCreateIssue } = useUi();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState("all");
  const [collapsed, setCollapsed] = useState({ done: true });

  const deepIssue = params.get("issue");
  useEffect(() => {
    if (deepIssue) {
      openIssue(deepIssue);
      const next = new URLSearchParams(params);
      next.delete("issue");
      setParams(next, { replace: true });
    }
    // Only react to the deep-link param, not to every param change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepIssue]);

  const project = params.get("project") || "all";

  const setProject = (value) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete("project");
    else next.set("project", value);
    setParams(next, { replace: true });
  };

  const sprint = state.sprints.find((item) => item.id === "sprint-24");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return state.issues.filter((issue) => {
      const issueProject = state.projects.find((item) => item.id === issue.projectId);
      if (project !== "all" && issueProject?.key !== project) return false;
      if (type !== "all" && issue.type !== type) return false;
      if (priority !== "all" && issue.priority !== priority) return false;
      if (assignee === "mine" && issue.assigneeId !== state.meId) return false;
      if (assignee === "unassigned" && issue.assigneeId) return false;
      if (assignee === "review" && issue.status !== "in_review") return false;
      if (term && !issue.title.toLowerCase().includes(term) && !issue.id.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [state.issues, state.projects, state.meId, project, type, priority, assignee, query]);

  const groups = STATUSES.map((status) => ({
    status,
    issues: filtered
      .filter((issue) => issue.status === status.id)
      .sort((a, b) => (PRIORITIES[b.priority]?.rank || 0) - (PRIORITIES[a.priority]?.rank || 0)),
  })).filter((group) => group.issues.length);

  const sprintIssues = state.issues.filter((issue) => issue.sprintId === sprint?.id);
  const sprintPoints = sprintIssues.reduce((total, issue) => total + issue.points, 0);
  const sprintDone = sprintIssues
    .filter((issue) => issue.status === "done")
    .reduce((total, issue) => total + issue.points, 0);

  const activeFilters = [
    project !== "all" && `project: ${project}`,
    type !== "all" && `type: ${type}`,
    priority !== "all" && `priority: ${priority}`,
    assignee !== "all" && `assignee: ${assignee}`,
    query && `“${query}”`,
  ].filter(Boolean);

  const reset = () => {
    setProject("all");
    setType("all");
    setPriority("all");
    setAssignee("all");
    setQuery("");
  };

  return (
    <main className="ws-main ws-scroll">
      <header className="ws-page-header">
        <div className="ws-page-header__titles">
          <div className="ws-eyebrow">Jira-style issue tracking · canonical work records</div>
          <h1 className="ws-display ws-display--grad" style={{ fontSize: 34 }}>
            Issues
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--vg-text-2)" }}>
            {filtered.length} of {state.issues.length} issues · board cards and chat captures
            resolve to these records.
          </p>
        </div>
        <div className="ws-row" style={{ gap: 8 }}>
          <div className="ws-tabs" role="tablist" aria-label="Issue views">
            <button type="button" className="ws-tab" data-active="true" role="tab" aria-selected="true">
              <ListFilter size={12} /> List
            </button>
            <button
              type="button"
              className="ws-tab"
              role="tab"
              aria-selected="false"
              onClick={() => navigate("/boards")}
            >
              <Kanban size={12} /> Board
            </button>
          </div>
          <button
            type="button"
            className="ws-btn ws-btn--primary"
            onClick={() => openCreateIssue({ projectId: state.projects[0].id })}
          >
            <Plus size={13} /> New issue
          </button>
        </div>
      </header>

      <section
        className="ws-panel ws-corners"
        style={{ padding: 14, marginBottom: 14 }}
      >
        <div className="ws-row ws-row--wrap" style={{ gap: 14 }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              border: "1px solid var(--vg-ember-line)",
              borderRadius: 8,
              background: "var(--vg-ember-soft)",
              color: "var(--vg-ember)",
            }}
          >
            <Target size={15} />
          </span>
          <div style={{ minWidth: 160, flex: "1 1 220px" }}>
            <div className="ws-h3">{sprint?.name}</div>
            <div style={{ fontSize: 9.5, color: "var(--vg-text-3)" }}>
              {shortDate(sprint?.start)} → {shortDate(sprint?.end)} · {sprint?.goal}
            </div>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 160 }}>
            <div className="ws-row" style={{ fontSize: 9.5, color: "var(--vg-text-3)", marginBottom: 5 }}>
              <span>points completed</span>
              <span className="ws-spacer" />
              <span className="ws-mono">
                {sprintDone}/{sprintPoints}
              </span>
            </div>
            <Meter value={sprintDone} total={sprintPoints || 1} />
          </div>
          <div className="ws-row" style={{ gap: 6 }}>
            <Tag tone="ember">{sprintIssues.length} in sprint</Tag>
            <Tag tone="ok">{sprintIssues.filter((i) => i.status === "done").length} done</Tag>
            <button
              type="button"
              className="ws-btn ws-btn--outline ws-btn--sm"
              onClick={() => navigate("/boards?board=board-orbit")}
            >
              Open sprint board <ArrowRight size={11} />
            </button>
          </div>
        </div>
      </section>

      <div
        className="ws-row ws-row--wrap"
        style={{ gap: 8, marginBottom: 12, alignItems: "center" }}
      >
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 320 }}>
          <Search
            size={12}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--vg-text-4)",
            }}
          />
          <input
            className="ws-input"
            placeholder="Search by title or key…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ paddingLeft: 30, height: 32 }}
            aria-label="Search issues"
          />
        </div>

        <select
          className="ws-select"
          value={project}
          onChange={(event) => setProject(event.target.value)}
          style={{ width: "auto", height: 32 }}
          aria-label="Filter by project"
        >
          <option value="all">All projects</option>
          {state.projects.map((item) => (
            <option key={item.id} value={item.key}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          className="ws-select"
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
          style={{ width: "auto", height: 32 }}
          aria-label="Filter by assignee"
        >
          <option value="all">Anyone</option>
          <option value="mine">Assigned to me</option>
          <option value="review">Waiting on my review</option>
          <option value="unassigned">Unassigned</option>
        </select>

        <select
          className="ws-select"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          style={{ width: "auto", height: 32 }}
          aria-label="Filter by priority"
        >
          <option value="all">Any priority</option>
          {Object.entries(PRIORITIES).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>

        <span style={{ width: 1, height: 16, background: "var(--vg-line)" }} />

        {["all", ...Object.keys(ISSUE_TYPES)].map((key) => (
          <button
            key={key}
            type="button"
            className="ws-chip"
            data-active={type === key}
            onClick={() => setType(key)}
            style={{ height: 26 }}
          >
            {key === "all" ? "All types" : `${ISSUE_TYPES[key].label}s`}
          </button>
        ))}

        <span className="ws-spacer" />
        {activeFilters.length ? (
          <button type="button" className="ws-btn ws-btn--ghost ws-btn--sm" onClick={reset}>
            <X size={11} /> Clear {activeFilters.length}
          </button>
        ) : null}
      </div>

      {groups.length ? (
        <div>
          {groups.map(({ status, issues }) => {
            const isCollapsed = collapsed[status.id];
            const points = issues.reduce((total, issue) => total + issue.points, 0);
            return (
              <section key={status.id} className="ws-issue-group">
                <header className="ws-issue-group__head">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((current) => ({ ...current, [status.id]: !isCollapsed }))
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      background: "transparent",
                      border: 0,
                      color: "inherit",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span className="ws-column__title">{status.label}</span>
                    <span className="ws-column__count">{issues.length}</span>
                  </button>
                  <span className="ws-spacer" />
                  <span style={{ fontSize: 9.5, color: "var(--vg-text-4)" }}>
                    {points} pts
                  </span>
                  <Tag tone={STATUS_TONE[status.id]}>{status.terminal ? "closed" : "open"}</Tag>
                </header>

                {!isCollapsed
                  ? issues.map((issue) => {
                      const owner = issue.assigneeId ? memberById[issue.assigneeId] : null;
                      return (
                        <div
                          key={issue.id}
                          className="ws-issue-row"
                          style={{ cursor: "pointer" }}
                          role="button"
                          tabIndex={0}
                          onClick={() => openIssue(issue.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openIssue(issue.id);
                            }
                          }}
                        >
                          <TypeIcon type={issue.type} />
                          <span className="ws-issue-row__key">{issue.id}</span>
                          <span className="ws-issue-row__title">{issue.title}</span>
                          <span className="ws-hidden-mobile" style={{ display: "flex", gap: 4 }}>
                            {issue.labels.slice(0, 2).map((label) => (
                              <Tag key={label}>{label}</Tag>
                            ))}
                          </span>
                          <span className="ws-issue-row__priority">
                            <PriorityMark priority={issue.priority} />
                          </span>
                          <span
                            className="ws-mono ws-issue-row__points"
                            style={{ fontSize: 10, color: "var(--vg-text-3)", textAlign: "right" }}
                          >
                            {issue.points || "—"}
                          </span>
                          <span
                            title={owner?.name || "Unassigned"}
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                          >
                            <Avatar member={owner} size="sm" presence={false} />
                          </span>
                          <span
                            className="ws-hidden-mobile"
                            style={{ fontSize: 9.5, color: "var(--vg-text-4)", textAlign: "right" }}
                          >
                            {relativeTime(issue.updatedAt)}
                          </span>
                        </div>
                      );
                    })
                  : null}
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No issues match those filters"
          body="Try clearing the filters or create a new issue for this project."
          action={
            <button type="button" className="ws-btn ws-btn--outline ws-btn--sm" onClick={reset}>
              Clear filters
            </button>
          }
        />
      )}

      <footer
        className="ws-row"
        style={{
          marginTop: 18,
          paddingTop: 12,
          borderTop: "1px solid var(--vg-line)",
          fontSize: 9.5,
          color: "var(--vg-text-4)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span>Status changes sync to board cards immediately</span>
        <span className="ws-spacer" />
        <span>Press “c” anywhere to file an issue</span>
      </footer>
    </main>
  );
}

export default IssuesPage;
