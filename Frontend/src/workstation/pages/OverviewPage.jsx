import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  CircleDot,
  Hash,
  Kanban,
  MessageSquare,
  Plus,
  ShieldCheck,
  Target,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { useWorkspace } from "../store/useWorkspace.js";
import { useUi } from "../store/useUi.js";
import {
  Avatar,
  AvatarStack,
  Meter,
  PriorityMark,
  RingGauge,
  Sparkline,
  Spot,
  Tag,
  TypeIcon,
} from "../components/ui.jsx";
import { relativeTime, shortDate } from "../lib/format.js";

const BURNDOWN = [78, 74, 69, 71, 63, 58, 54, 49, 47, 41, 38, 33];

function ModulePlate({ icon: Icon, label, count, detail, to, tone }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="ws-panel ws-panel--hover ws-corners"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 13px",
        background: "#08080a",
        textAlign: "left",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 30,
          height: 30,
          border: `1px solid ${tone}44`,
          borderRadius: 7,
          background: `${tone}14`,
          color: tone,
        }}
      >
        <Icon size={14} />
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: "block",
            fontFamily: "var(--vg-font-display)",
            fontSize: 12,
            color: "var(--vg-text)",
          }}
        >
          {label}
        </span>
        <span style={{ display: "block", fontSize: 9.5, color: "var(--vg-text-3)" }}>
          {detail}
        </span>
      </span>
      <span
        className="ws-mono"
        style={{ fontFamily: "var(--vg-font-display)", fontSize: 17, color: "#fff" }}
      >
        {count}
      </span>
      <ArrowUpRight size={12} style={{ color: "var(--vg-text-4)" }} />
    </button>
  );
}

function IsoScene() {
  return (
    <div className="ws-iso" aria-hidden="true">
      <div className="ws-iso__glow" />
      <div className="ws-iso__scene">
        <div className="ws-iso__plate ws-iso__plate--jira">
          <span className="ws-iso__chip" style={{ top: 22, left: 24 }}>
            <Bug size={8} /> issues
          </span>
          <span className="ws-iso__chip" style={{ bottom: 26, right: 26 }}>
            workflow
          </span>
        </div>
        <div className="ws-iso__plate ws-iso__plate--trello">
          <span className="ws-iso__chip" style={{ top: 30, right: 26 }}>
            <Kanban size={8} /> boards
          </span>
          <span className="ws-iso__chip" style={{ bottom: 34, left: 22 }}>
            cards
          </span>
        </div>
        <div className="ws-iso__plate ws-iso__plate--slack ws-iso__plate--ember">
          <span className="ws-iso__chip" style={{ top: 28, left: 28 }}>
            <Hash size={8} /> channels
          </span>
          <span
            className="ws-iso__chip"
            style={{
              bottom: 30,
              right: 24,
              borderColor: "rgba(255,68,51,.45)",
              color: "#ffb3a1",
            }}
          >
            <Zap size={8} /> live
          </span>
        </div>
      </div>
    </div>
  );
}

function Burndown() {
  const width = 360;
  const height = 96;
  const max = Math.max(...BURNDOWN);
  const step = width / (BURNDOWN.length - 1);
  const toPath = (values) =>
    values
      .map((value, index) => {
        const x = index * step;
        const y = height - 6 - (value / max) * (height - 16);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  const actual = toPath(BURNDOWN);
  const ideal = toPath(BURNDOWN.map((_, index) => max - (index / (BURNDOWN.length - 1)) * max));

  return (
    <div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Sprint burndown, actual versus ideal"
      >
        <defs>
          <linearGradient id="burndown-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4433" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#ff4433" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={height * ratio}
            y2={height * ratio}
            stroke="rgba(255,255,255,0.055)"
            strokeDasharray="2 4"
          />
        ))}
        <path d={`${actual} L${width},${height} L0,${height} Z`} fill="url(#burndown-fill)" />
        <path d={ideal} fill="none" stroke="rgba(255,255,255,0.18)" strokeDasharray="3 4" strokeWidth="1" />
        <path d={actual} fill="none" stroke="#ff5a43" strokeWidth="1.6" strokeLinejoin="round" />
        <circle
          cx={width}
          cy={height - 6 - (BURNDOWN[BURNDOWN.length - 1] / max) * (height - 16)}
          r="2.6"
          fill="#ff7a52"
        />
      </svg>
      <div
        className="ws-row"
        style={{ fontSize: 9, color: "var(--vg-text-4)", marginTop: 4, gap: 14 }}
      >
        <span className="ws-row" style={{ gap: 5 }}>
          <span style={{ width: 12, height: 1.5, background: "#ff5a43" }} /> actual
        </span>
        <span className="ws-row" style={{ gap: 5 }}>
          <span style={{ width: 12, height: 1.5, background: "rgba(255,255,255,.2)" }} /> ideal
        </span>
        <span className="ws-spacer" />
        <span>sprint day 8 / 12</span>
      </div>
    </div>
  );
}

export function OverviewPage() {
  const { state, memberById, me } = useWorkspace();
  const { openIssue, openCreateIssue } = useUi();
  const navigate = useNavigate();

  const sprint = state.sprints.find((item) => item.id === "sprint-24");
  const sprintIssues = useMemo(
    () => state.issues.filter((issue) => issue.sprintId === sprint?.id),
    [state.issues, sprint],
  );
  const done = sprintIssues.filter((issue) => issue.status === "done");
  const points = sprintIssues.reduce((total, issue) => total + issue.points, 0);
  const donePoints = done.reduce((total, issue) => total + issue.points, 0);

  const openIssues = state.issues.filter((issue) => issue.status !== "done");
  const inFlight = state.issues.filter(
    (issue) => issue.status === "in_progress" || issue.status === "in_review",
  );
  const unread = [...state.channels, ...state.dms].reduce(
    (total, channel) => total + (channel.unread || 0),
    0,
  );
  const messages = [...state.channels, ...state.dms].reduce(
    (total, channel) => total + channel.messages.length,
    0,
  );

  const myQueue = useMemo(() => {
    const mine = state.issues.filter(
      (issue) =>
        issue.status !== "done" &&
        (issue.assigneeId === me.id || issue.reporterId === me.id || issue.status === "in_review"),
    );
    return mine.slice(0, 5);
  }, [state.issues, me.id]);

  const risks = useMemo(
    () =>
      sprintIssues
        .filter(
          (issue) =>
            issue.status !== "done" && ["critical", "high"].includes(issue.priority),
        )
        .slice(0, 3),
    [sprintIssues],
  );

  const activity = state.activity.slice(0, 6);
  const onlineMembers = state.members.filter((member) => member.status === "online");

  const stats = [
    {
      label: "Open issues",
      value: openIssues.length,
      unit: "items",
      delta: "+6 this sprint",
      dir: "up",
      points: [22, 26, 24, 29, 27, 33, 31, 35],
      tone: "ember",
    },
    {
      label: "In flight",
      value: inFlight.length,
      unit: "cards",
      delta: "WIP limit 6",
      dir: "flat",
      points: [4, 6, 5, 7, 6, 8, 7, 9],
      tone: "ok",
    },
    {
      label: "Unread",
      value: unread,
      unit: "messages",
      delta: "3 channels",
      dir: "flat",
      points: [2, 5, 3, 6, 4, 7, 3, 6],
      tone: "ok",
    },
    {
      label: "Cycle time",
      value: "2.4",
      unit: "days",
      delta: "-0.6d vs last sprint",
      dir: "up",
      points: [3.4, 3.2, 3.3, 2.9, 3.0, 2.7, 2.6, 2.4],
      tone: "ember",
    },
  ];

  return (
    <main className="ws-main ws-scroll">
      <section className="ws-enter ws-hero" style={{ marginBottom: 20 }}>
        <div style={{ minWidth: 0 }}>
          <div className="ws-eyebrow">Orbit Labs · Sprint 24 · Reliability</div>
          <h1
            className="ws-display ws-display--grad"
            style={{ fontSize: "clamp(34px, 4.4vw, 58px)", marginBottom: 14 }}
          >
            One workspace.
            <br />
            Three systems.
          </h1>
          <p
            style={{
              maxWidth: 470,
              margin: "0 0 20px",
              fontSize: 12.5,
              lineHeight: 1.75,
              color: "var(--vg-text-2)",
            }}
          >
            Conversations become issues. Issues become cards. Cards move the roadmap — without a
            single copy of the truth going stale.
          </p>

          <div className="ws-row ws-row--wrap" style={{ gap: 8 }}>
            <button
              type="button"
              className="ws-btn ws-btn--primary ws-btn--lg"
              onClick={() => navigate("/boards?board=board-orbit")}
            >
              <Kanban size={14} /> Open delivery board
            </button>
            <button
              type="button"
              className="ws-btn ws-btn--outline ws-btn--lg"
              onClick={() => openCreateIssue({})}
            >
              <Plus size={14} /> Create issue
            </button>
            <button
              type="button"
              className="ws-btn ws-btn--ghost ws-btn--lg"
              onClick={() => navigate("/pulse")}
            >
              Pulse <ArrowRight size={13} />
            </button>
          </div>

          <div
            className="ws-row ws-row--wrap"
            style={{ marginTop: 22, gap: 16, fontSize: 10, color: "var(--vg-text-3)" }}
          >
            <span className="ws-row" style={{ gap: 8 }}>
              <AvatarStack members={onlineMembers} max={4} />
              {onlineMembers.length} online
            </span>
            <span className="ws-row" style={{ gap: 5 }}>
              <ShieldCheck size={12} style={{ color: "var(--vg-ok)" }} /> 3 modules synced
            </span>
            <span className="ws-row" style={{ gap: 5 }}>
              <span className="ws-dot" style={{ color: "var(--vg-ok)" }} /> demo workspace
            </span>
          </div>
        </div>

        <div style={{ position: "relative", minWidth: 0 }}>
          <div className="ws-scrim-grid" />
          <IsoScene />
          <div
            className="ws-row"
            style={{
              justifyContent: "center",
              gap: 6,
              fontSize: 9,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--vg-text-4)",
            }}
          >
            <span className="ws-dot" style={{ color: "var(--vg-ember)" }} /> issuetracker
            <span style={{ color: "var(--vg-text-4)" }}>·</span> boards
            <span style={{ color: "var(--vg-text-4)" }}>·</span> messaging
          </div>
        </div>
      </section>

      <div className="ws-ticker" style={{ marginBottom: 16 }}>
        <div className="ws-ticker__track">
          {[...state.ticker, ...state.ticker].map((item, index) => (
            <span key={`${item.label}-${index}`} className="ws-ticker__item">
              <span
                className="ws-dot"
                style={{ color: index % 3 === 0 ? "var(--vg-ember)" : "var(--vg-text-3)" }}
              />
              {item.label} <b>{item.value}</b>
            </span>
          ))}
        </div>
      </div>

      <section
        className="ws-enter"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {stats.map((stat, index) => (
          <Spot key={stat.label} className="ws-panel ws-corners ws-stat">
            <div className="ws-row" style={{ marginBottom: 10 }}>
              <span className="ws-label">{stat.label}</span>
              <span className="ws-spacer" />
              <span
                className="ws-tag"
                style={{
                  height: 17,
                  borderColor: index === 0 ? "var(--vg-ember-line)" : undefined,
                  color: index === 0 ? "#ffab97" : undefined,
                }}
              >
                {stat.unit}
              </span>
            </div>
            <div className="ws-row" style={{ alignItems: "flex-end", gap: 10 }}>
              <span className="ws-stat__value">
                {stat.value}
              </span>
              <span className="ws-spacer" />
              <Sparkline
                points={stat.points}
                tone={stat.tone}
                width={92}
                height={26}
              />
            </div>
            <div className="ws-row" style={{ marginTop: 9 }}>
              <span className="ws-stat__delta" data-dir={stat.dir === "down" ? "down" : "up"}>
                {stat.dir === "up" ? "▲" : stat.dir === "down" ? "▼" : "•"} {stat.delta}
              </span>
            </div>
          </Spot>
        ))}
      </section>

      <div className="ws-split">
        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <section className="ws-panel ws-corners">
            <div className="ws-panel__head">
              <Target size={13} style={{ color: "var(--vg-ember)" }} />
              <div style={{ minWidth: 0 }}>
                <div className="ws-h3">{sprint?.name}</div>
                <div style={{ fontSize: 9.5, color: "var(--vg-text-3)" }}>
                  {shortDate(sprint?.start)} → {shortDate(sprint?.end)} · {sprint?.goal}
                </div>
              </div>
              <span className="ws-spacer" />
              <Tag tone="ember">active</Tag>
            </div>
            <div className="ws-panel__body" style={{ paddingTop: 14 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0,1fr)",
                  gap: 18,
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <RingGauge value={donePoints} total={points || 1} caption="points" />
                <div>
                  <div className="ws-row" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 10.5, color: "var(--vg-text-2)" }}>
                      Sprint progress
                    </span>
                    <span className="ws-spacer" />
                    <span className="ws-mono" style={{ fontSize: 10, color: "var(--vg-text-3)" }}>
                      {donePoints} / {points} pts
                    </span>
                  </div>
                  <Meter value={donePoints} total={points || 1} />
                  <div
                    className="ws-row"
                    style={{ marginTop: 12, gap: 14, fontSize: 9.5, color: "var(--vg-text-3)", flexWrap: "wrap" }}
                  >
                    <span>{done.length} done</span>
                    <span>{sprintIssues.length - done.length} remaining</span>
                    <span className="ws-row" style={{ gap: 4, color: "var(--vg-ember-2)" }}>
                      <TriangleAlert size={10} /> {risks.length} risks
                    </span>
                    <span className="ws-spacer" />
                    <span>5 days left</span>
                  </div>
                </div>
              </div>
              <Burndown />
            </div>
          </section>

          <section className="ws-panel">
            <div className="ws-panel__head">
              <Zap size={13} style={{ color: "var(--vg-ember)" }} />
              <div className="ws-h3">My focus</div>
              <span className="ws-spacer" />
              <Link to="/issues" className="ws-btn ws-btn--ghost ws-btn--sm">
                All issues <ArrowRight size={11} />
              </Link>
            </div>
            <div style={{ padding: "4px 6px 8px" }}>
              {myQueue.map((issue) => {
                const assignee = memberById[issue.assigneeId];
                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => openIssue(issue.id)}
                    className="ws-issue-row"
                    style={{ gridTemplateColumns: "18px 74px minmax(0,1fr) auto 26px", borderBottom: "1px solid rgba(255,255,255,.045)" }}
                  >
                    <TypeIcon type={issue.type} />
                    <span className="ws-issue-row__key">{issue.id}</span>
                    <span className="ws-issue-row__title">{issue.title}</span>
                    <Tag tone={issue.status === "in_review" ? "warn" : issue.status === "done" ? "ok" : "neutral"}>
                      {issue.status.replace("_", " ")}
                    </Tag>
                    <Avatar member={assignee} size="sm" presence={false} />
                  </button>
                );
              })}
              {!myQueue.length ? (
                <div style={{ padding: 20, fontSize: 11, color: "var(--vg-text-3)" }}>
                  Nothing assigned. Pull something from the backlog.
                </div>
              ) : null}
            </div>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <ModulePlate
              icon={Hash}
              label="Slack · Channels"
              detail={`${messages} messages · ${unread} unread`}
              count={state.channels.length}
              to="/channels"
              tone="#7dd3fc"
            />
            <ModulePlate
              icon={Kanban}
              label="Trello · Boards"
              detail={`${state.boards.length} boards · ${inFlight.length} in flow`}
              count={state.boards.length}
              to="/boards"
              tone="#4ade80"
            />
            <ModulePlate
              icon={Bug}
              label="Jira · Issues"
              detail={`${openIssues.length} open · ${done.length} shipped`}
              count={state.issues.length}
              to="/issues"
              tone="#ff4433"
            />
          </section>
        </div>

        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <section className="ws-panel">
            <div className="ws-panel__head">
              <Activity size={13} style={{ color: "var(--vg-text-2)" }} />
              <div className="ws-h3">Unified activity</div>
              <span className="ws-spacer" />
              <Link to="/pulse" className="ws-btn ws-btn--ghost ws-btn--sm">
                Pulse <ArrowRight size={11} />
              </Link>
            </div>
            <div style={{ padding: "4px 12px 10px" }}>
              {activity.map((entry) => {
                const actor = memberById[entry.actorId];
                const Icon =
                  entry.module === "slack"
                    ? MessageSquare
                    : entry.module === "trello"
                      ? Kanban
                      : Bug;
                return (
                  <div key={entry.id} className="ws-activity">
                    <span className="ws-activity__icon" data-module={entry.module}>
                      <Icon size={12} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ color: "var(--vg-text)", fontSize: 11.5 }}>
                        {actor?.name?.split(" ")[0]}
                      </span>{" "}
                      {entry.verb}{" "}
                      <span style={{ color: "var(--vg-ember-2)" }}>{entry.target}</span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 10,
                          color: "var(--vg-text-3)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.detail}
                      </span>
                    </span>
                    <span className="ws-activity__time">{relativeTime(entry.at)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="ws-panel">
            <div className="ws-panel__head">
              <TriangleAlert size={13} style={{ color: "var(--vg-warn)" }} />
              <div className="ws-h3">At risk this sprint</div>
            </div>
            <div style={{ padding: 10, display: "grid", gap: 8 }}>
              {risks.map((issue) => {
                const assignee = memberById[issue.assigneeId];
                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => openIssue(issue.id)}
                    className="ws-card"
                    style={{ padding: "10px 11px", cursor: "pointer" }}
                  >
                    <div className="ws-row" style={{ gap: 8 }}>
                      <PriorityMark priority={issue.priority} />
                      <span className="ws-issue-row__key">{issue.id}</span>
                      <span className="ws-spacer" />
                      <Avatar member={assignee} size="sm" presence={false} />
                    </div>
                    <span className="ws-card__title" style={{ marginBottom: 6 }}>
                      {issue.title}
                    </span>
                    <div className="ws-row" style={{ fontSize: 9.5, color: "var(--vg-text-3)" }}>
                      <CircleDot size={9} /> {issue.status.replace("_", " ")}
                      <span className="ws-spacer" />
                      {issue.dueAt ? shortDate(issue.dueAt) : "no date"}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="ws-panel">
            <div className="ws-panel__head">
              <CheckCircle2 size={13} style={{ color: "var(--vg-ok)" }} />
              <div className="ws-h3">Module sync</div>
              <span className="ws-spacer" />
              <Tag tone="ok">live</Tag>
            </div>
            <div style={{ padding: "10px 14px 14px", display: "grid", gap: 9 }}>
              {state.integrations.slice(0, 3).map((integration) => (
                <div key={integration.id} className="ws-row" style={{ gap: 9 }}>
                  <span
                    className="ws-dot"
                    style={{
                      color:
                        integration.status === "connected" ? "var(--vg-ok)" : "var(--vg-text-4)",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "var(--vg-text-2)", flex: 1 }}>
                    {integration.name}
                  </span>
                  <span style={{ fontSize: 9.5, color: "var(--vg-text-4)" }}>
                    {integration.syncedAt ? relativeTime(integration.syncedAt) : "paused"}
                  </span>
                </div>
              ))}
              <button
                type="button"
                className="ws-btn ws-btn--outline ws-btn--sm ws-btn--block"
                onClick={() => navigate("/pulse")}
                style={{ marginTop: 2 }}
              >
                Manage bridges
              </button>
            </div>
          </section>
        </div>
      </div>

      <footer
        className="ws-row"
        style={{
          marginTop: 26,
          paddingTop: 14,
          borderTop: "1px solid var(--vg-line)",
          fontSize: 10,
          color: "var(--vg-text-4)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span>WorkStation · demo workspace with local state</span>
        <span className="ws-spacer" />
        <span>{state.issues.length} issues</span>
        <span>·</span>
        <span>{state.boards.length} boards</span>
        <span>·</span>
        <span>
          {state.channels.length + state.dms.length} channels
        </span>
      </footer>
    </main>
  );
}

export default OverviewPage;
