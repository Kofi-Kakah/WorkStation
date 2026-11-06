import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  CheckSquare,
  GripVertical,
  Kanban,
  MessageSquare,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useWorkspace } from "../store/useWorkspace.js";
import { useUi } from "../store/useUi.js";
import {
  Avatar,
  AvatarStack,
  Chip,
  PriorityMark,
  Spot,
  Tag,
  TypeIcon,
} from "../components/ui.jsx";
import { dueMeta, shortDate } from "../lib/format.js";

const TONE_BAR = {
  ember: "ws-label-pill--ember",
  info: "ws-label-pill--info",
  ok: "ws-label-pill--ok",
  warn: "ws-label-pill--warn",
  violet: "ws-label-pill--violet",
};

function BoardCard({ issue, onOpen, dragging = false }) {
  const { memberById } = useWorkspace();
  const assignee = issue.assigneeId ? memberById[issue.assigneeId] : null;
  const due = dueMeta(issue.dueAt);
  const checks = issue.checklist.length;
  const doneChecks = issue.checklist.filter((item) => item.done).length;

  return (
    <Spot
      as="article"
      className="ws-card"
      data-dragging={dragging}
      onClick={() => onOpen(issue.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(issue.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${issue.id}: ${issue.title}`}
    >
      <div className="ws-row" style={{ gap: 6 }}>
        <TypeIcon type={issue.type} />
        <span className="ws-issue-row__key">{issue.id}</span>
        <span className="ws-spacer" />
        <PriorityMark priority={issue.priority} />
      </div>

      <span className="ws-card__title">{issue.title}</span>

      {issue.labels.length ? (
        <div className="ws-card__labels" style={{ marginBottom: 8 }}>
          {issue.labels.slice(0, 4).map((label) => (
            <span
              key={label}
              className={`ws-label-pill ${
                TONE_BAR[label === "auth" || label === "realtime" ? "ember" : label === "search" ? "info" : label === "boards" ? "ok" : "violet"]
              }`}
              title={label}
            />
          ))}
        </div>
      ) : null}

      <div className="ws-card__foot">
        <Avatar member={assignee} size="sm" presence={false} />
        {due ? (
          <span
            className="ws-row"
            style={{
              gap: 4,
              color:
                due.tone === "ember"
                  ? "var(--vg-ember)"
                  : due.tone === "warn"
                    ? "var(--vg-warn)"
                    : "var(--vg-text-3)",
            }}
          >
            <CalendarDays size={10} /> {due.text}
          </span>
        ) : null}
        <span className="ws-spacer" />
        {checks ? (
          <span className="ws-row" style={{ gap: 3 }}>
            <CheckSquare size={10} /> {doneChecks}/{checks}
          </span>
        ) : null}
        {issue.comments.length ? (
          <span className="ws-row" style={{ gap: 3 }}>
            <MessageSquare size={10} /> {issue.comments.length}
          </span>
        ) : null}
        {issue.points ? (
          <span className="ws-tag" style={{ height: 16, padding: "0 5px" }}>
            {issue.points}
          </span>
        ) : null}
      </div>
    </Spot>
  );
}

function SortableCard({ issue, onOpen }) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
    data: { status: issue.status },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "none",
      }}
      {...listeners}
    >
      <BoardCard issue={issue} onOpen={onOpen} dragging={isDragging} />
    </div>
  );
}

function Column({ list, issues, onOpen, onCreate }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${list.id}`,
    data: { status: list.status },
  });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const overLimit = list.wip ? issues.length > list.wip : false;

  const submit = (event) => {
    event.preventDefault();
    if (!title.trim()) {
      setAdding(false);
      return;
    }
    onCreate(title.trim(), list);
    setTitle("");
    setAdding(false);
  };

  return (
    <section className="ws-column" aria-label={`${list.title} column`}>
      <header className="ws-column__head">
        <span
          className="ws-dot"
          style={{
            color:
              list.status === "done"
                ? "var(--vg-ok)"
                : list.status === "in_progress"
                  ? "var(--vg-ember)"
                  : list.status === "in_review"
                    ? "var(--vg-warn)"
                    : list.status === "ready"
                      ? "var(--vg-info)"
                      : "var(--vg-text-4)",
          }}
        />
        <span className="ws-column__title">{list.title}</span>
        <span className="ws-column__count" style={overLimit ? { color: "var(--vg-warn)", borderColor: "rgba(251,191,36,.35)" } : undefined}>
          {issues.length}
          {list.wip ? `/${list.wip}` : ""}
        </span>
        <span className="ws-spacer" />
        <button
          type="button"
          className="ws-btn ws-btn--icon"
          style={{ width: 24, height: 24 }}
          onClick={() => setAdding(true)}
          aria-label={`Add card to ${list.title}`}
        >
          <Plus size={12} />
        </button>
      </header>

      <div
        ref={setNodeRef}
        className="ws-column__list ws-scroll"
        data-over={isOver}
      >
        <SortableContext items={issues.map((issue) => issue.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <SortableCard key={issue.id} issue={issue} onOpen={onOpen} />
          ))}
        </SortableContext>

        {!issues.length ? (
          <div
            style={{
              padding: "18px 10px",
              border: "1px dashed var(--vg-line)",
              borderRadius: 7,
              textAlign: "center",
              fontSize: 10,
              color: "var(--vg-text-4)",
            }}
          >
            Drop a card here
          </div>
        ) : null}

        {adding ? (
          <form onSubmit={submit}>
            <textarea
              className="ws-textarea"
              autoFocus
              rows={2}
              placeholder="Card title…"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit(event);
                }
                if (event.key === "Escape") {
                  setAdding(false);
                  setTitle("");
                }
              }}
              style={{ minHeight: 54, fontSize: 11.5 }}
            />
            <div className="ws-row" style={{ gap: 6, marginTop: 6 }}>
              <button type="submit" className="ws-btn ws-btn--primary ws-btn--sm">
                Add card
              </button>
              <button
                type="button"
                className="ws-btn ws-btn--ghost ws-btn--sm"
                onClick={() => {
                  setAdding(false);
                  setTitle("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </section>
  );
}

export function BoardsPage() {
  const { state, moveIssue, createIssue, addList } = useWorkspace();
  const { openIssue, openCreateIssue } = useUi();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeId, setActiveId] = useState(null);
  const [listDraft, setListDraft] = useState(false);
  const [listTitle, setListTitle] = useState("");

  const board =
    state.boards.find((item) => item.id === params.get("board")) || state.boards[0];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filtered = useMemo(() => {
    return state.issues.filter((issue) => {
      if (issue.projectId !== board.projectId) return false;
      if (assignee === "mine" && issue.assigneeId !== state.meId) return false;
      if (assignee === "unassigned" && issue.assigneeId) return false;
      if (typeFilter !== "all" && issue.type !== typeFilter) return false;
      if (query.trim()) {
        const term = query.trim().toLowerCase();
        if (
          !issue.title.toLowerCase().includes(term) &&
          !issue.id.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [state.issues, state.meId, board.projectId, assignee, typeFilter, query]);

  const columns = board.lists.map((list) => {
    const order = state.cardOrder?.[list.status] || [];
    const issues = filtered
      .filter((issue) => issue.status === list.status)
      .sort((a, b) => {
        const aIndex = order.indexOf(a.id);
        const bIndex = order.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    return { list, issues };
  });

  const boardMembers = useMemo(() => {
    const ids = new Set(filtered.map((issue) => issue.assigneeId).filter(Boolean));
    return state.members.filter((member) => ids.has(member.id));
  }, [filtered, state.members]);

  const activeIssue = activeId ? state.issues.find((issue) => issue.id === activeId) : null;

  const statusFor = (id) => {
    const key = String(id);
    if (key.startsWith("col:")) {
      const list = board.lists.find((item) => `col:${item.id}` === key);
      return list?.status || null;
    }
    return state.issues.find((issue) => issue.id === key)?.status || null;
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const nextStatus = statusFor(over.id);
    const issue = state.issues.find((item) => item.id === active.id);
    if (!nextStatus || !issue) return;
    const beforeId = String(over.id).startsWith("col:") ? null : String(over.id);
    if (beforeId === issue.id) return;
    if (issue.status === nextStatus && !beforeId) return;
    moveIssue(issue.id, nextStatus, beforeId);
  };

  const createCard = (title, list) => {
    createIssue({
      title,
      projectId: board.projectId,
      status: list.status,
      sprintId: board.projectId === "orb" ? "sprint-24" : null,
      type: "task",
      priority: "medium",
    });
  };

  const openCount = filtered.filter((issue) => issue.status !== "done").length;
  const flowCount = filtered.filter(
    (issue) => issue.status === "in_progress" || issue.status === "in_review",
  ).length;

  return (
    <main className="ws-main ws-scroll" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header className="ws-page-header" style={{ marginBottom: 14 }}>
        <div className="ws-page-header__titles">
          <div className="ws-eyebrow">Trello-style boards · one card per issue</div>
          <h1 className="ws-display ws-display--grad" style={{ fontSize: 34 }}>
            Boards
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--vg-text-2)" }}>
            {board.description} Drag a card and the linked issue changes status instantly.
          </p>
        </div>
        <div className="ws-row" style={{ gap: 8 }}>
          <button
            type="button"
            className="ws-btn ws-btn--outline"
            onClick={() => {
              setQuery("");
              setAssignee("all");
              setTypeFilter("all");
            }}
          >
            <SlidersHorizontal size={13} /> Reset filters
          </button>
          <button
            type="button"
            className="ws-btn ws-btn--primary"
            onClick={() => openCreateIssue({ projectId: board.projectId })}
          >
            <Plus size={13} /> New issue
          </button>
        </div>
      </header>

      <div
        className="ws-row ws-row--wrap"
        style={{ gap: 10, marginBottom: 14, alignItems: "center" }}
      >
        <div className="ws-scroll-row" style={{ gap: 4 }}>
          {state.boards.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ws-board-tab"
              data-active={item.id === board.id}
              onClick={() => setParams({ board: item.id })}
            >
              <Kanban size={12} />
              {item.name}
              <span style={{ color: "var(--vg-text-4)", fontSize: 9.5 }}>
                {state.issues.filter((issue) => issue.projectId === item.projectId).length}
              </span>
            </button>
          ))}
        </div>
        <span className="ws-spacer" />
        <div className="ws-row" style={{ gap: 6 }}>
          <AvatarStack members={boardMembers} max={4} />
          <span style={{ fontSize: 10, color: "var(--vg-text-3)" }}>
            {openCount} open · {flowCount} in flow
          </span>
        </div>
      </div>

      <div
        className="ws-row ws-row--wrap"
        style={{ gap: 8, marginBottom: 12, alignItems: "center" }}
      >
        <div style={{ position: "relative", maxWidth: 260, flex: "1 1 180px" }}>
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
            placeholder="Filter cards…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ paddingLeft: 30, height: 30 }}
            aria-label="Filter cards"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="ws-msg__action"
              style={{ position: "absolute", right: 3, top: 3 }}
              aria-label="Clear filter"
            >
              <X size={11} />
            </button>
          ) : null}
        </div>

        <Chip active={assignee === "all"} onClick={() => setAssignee("all")}>
          All cards
        </Chip>
        <Chip active={assignee === "mine"} onClick={() => setAssignee("mine")}>
          Assigned to me
        </Chip>
        <Chip active={assignee === "unassigned"} onClick={() => setAssignee("unassigned")}>
          Unassigned
        </Chip>
        <span style={{ width: 1, height: 16, background: "var(--vg-line)" }} />
        {["all", "bug", "story", "task"].map((type) => (
          <Chip
            key={type}
            active={typeFilter === type}
            onClick={() => setTypeFilter(type)}
            style={{ height: 24 }}
          >
            {type === "all" ? "Any type" : type}
          </Chip>
        ))}
        <span className="ws-spacer" />
        <Tag tone="ok">
          <Sparkles size={9} /> workflow sync live
        </Tag>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={handleDragEnd}
      >
        <div className="ws-board ws-scroll" style={{ flex: 1, minHeight: 0 }}>
          {columns.map(({ list, issues }) => (
            <Column
              key={list.id}
              list={list}
              issues={issues}
              onOpen={openIssue}
              onCreate={createCard}
            />
          ))}

          {!listDraft ? (
            <button
              type="button"
              className="ws-add-column"
              onClick={() => {
                setListDraft(true);
                setListTitle("");
              }}
            >
              <Plus size={13} /> Add list
            </button>
          ) : null}

          {listDraft ? (
            <div
              className="ws-column"
              style={{ padding: 10, maxHeight: "none", alignSelf: "stretch" }}
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (listTitle.trim()) {
                    addList(board.id, listTitle.trim());
                  }
                  setListDraft(false);
                  setListTitle("");
                }}
              >
                <input
                  className="ws-input"
                  autoFocus
                  placeholder="List name"
                  value={listTitle}
                  onChange={(event) => setListTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setListDraft(false);
                  }}
                />
                <div className="ws-row" style={{ gap: 6, marginTop: 8 }}>
                  <button type="submit" className="ws-btn ws-btn--primary ws-btn--sm">
                    Add list
                  </button>
                  <button
                    type="button"
                    className="ws-btn ws-btn--ghost ws-btn--sm"
                    onClick={() => setListDraft(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }}>
          {activeIssue ? (
            <div style={{ width: 268 }}>
              <div className="ws-card ws-card--overlay">
                <div className="ws-row" style={{ gap: 6 }}>
                  <TypeIcon type={activeIssue.type} />
                  <span className="ws-issue-row__key">{activeIssue.id}</span>
                  <span className="ws-spacer" />
                  <GripVertical size={11} style={{ color: "var(--vg-text-4)" }} />
                </div>
                <span className="ws-card__title">{activeIssue.title}</span>
                <div className="ws-card__foot">
                  <Avatar
                    member={activeIssue.assigneeId ? state.members.find((m) => m.id === activeIssue.assigneeId) : null}
                    size="sm"
                    presence={false}
                  />
                  <span className="ws-spacer" />
                  <span>{activeIssue.points} pts</span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <footer
        className="ws-row"
        style={{
          marginTop: 10,
          fontSize: 9.5,
          color: "var(--vg-text-4)",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span>Drag cards between columns · the issue status follows</span>
        <span className="ws-spacer" />
        <span>Board updated {shortDate(new Date().toISOString())}</span>
        <span>·</span>
        <span>Card detail opens the shared issue record</span>
      </footer>
    </main>
  );
}

export default BoardsPage;
