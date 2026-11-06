import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  Bug,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Command,
  Hash,
  Kanban,
  LayoutDashboard,
  Menu,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useWorkspace } from "../store/useWorkspace.js";
import { useUi } from "../store/useUi.js";
import { Avatar, Tag } from "./ui.jsx";

const NAV = [
  {
    id: "command",
    label: "Command",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/pulse", label: "Pulse", icon: Activity },
    ],
  },
  {
    id: "build",
    label: "Build",
    items: [
      { to: "/issues", label: "Issues", icon: Bug, badge: "issues" },
      { to: "/boards", label: "Boards", icon: Kanban },
      { to: "/channels", label: "Channels", icon: Hash, badge: "unread" },
    ],
  },
];

function useOutsideClose(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);
  return ref;
}

function Brand() {
  return (
    <Link to="/" className="ws-brand" aria-label="WorkStation home">
      <span className="ws-brand__mark" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path
            d="M1.6 3.2 4.4 12.8 8 6.1l3.6 6.7 2.8-9.6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="ws-brand__name">
        Work<span style={{ color: "var(--vg-ember)" }}>Station</span>
      </span>
    </Link>
  );
}

function WorkspaceSwitcher() {
  const { state } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(() => setOpen(false));

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 0, flex: "0 1 auto" }}>
      <button
        type="button"
        className="ws-ws-switcher"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="ws-ws-switcher__avatar">OL</span>
        <span className="ws-sidebar__text" style={{ minWidth: 0, flex: 1 }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--vg-font-display)",
              fontSize: 11.5,
              lineHeight: 1.3,
            }}
          >
            {state.workspace.name}
          </span>
          <span
            style={{ display: "block", fontSize: 9.5, color: "var(--vg-text-3)" }}
          >
            {state.workspace.plan}
          </span>
        </span>
        <ChevronDown size={13} className="ws-sidebar__text" style={{ color: "var(--vg-text-3)" }} />
      </button>

      {open ? (
        <div
          className="ws-panel ws-corners"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: 244,
            zIndex: 40,
            padding: 6,
            boxShadow: "0 30px 60px -30px #000",
          }}
        >
          <div className="ws-label" style={{ padding: "6px 8px" }}>
            Workspace
          </div>
          <button
            type="button"
            className="ws-nav-item"
            data-active="true"
            style={{ height: 34 }}
          >
            <span className="ws-ws-switcher__avatar" style={{ width: 20, height: 20, fontSize: 9 }}>
              OL
            </span>
            Orbit Labs
            <span className="ws-nav-item__badge">7</span>
          </button>
          <div className="ws-label" style={{ padding: "10px 8px 6px" }}>
            Actions
          </div>
          <button
            type="button"
            className="ws-nav-item"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("ws:reset"));
            }}
          >
            <RotateCcw size={14} />
            Reset demo data
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Sidebar({ collapsed, onNavigate }) {
  const { state } = useWorkspace();
  const { setPaletteOpen, openCreateIssue } = useUi();
  const location = useLocation();
  const navigate = useNavigate();

  const unread = [...state.channels, ...state.dms].reduce(
    (total, channel) => total + (channel.unread || 0),
    0,
  );
  const openIssues = state.issues.filter((issue) => issue.status !== "done").length;

  const isActive = (item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`);

  const badgeValue = (badge) => {
    if (badge === "issues") return openIssues;
    if (badge === "unread") return unread || null;
    return null;
  };

  return (
    <>
      <div className="ws-sidebar__head">
        <WorkspaceSwitcher />
      </div>

      <div className="ws-sidebar__scroll ws-scroll">
        {!collapsed ? (
          <button
            type="button"
            className="ws-btn ws-btn--outline ws-btn--block"
            onClick={() => setPaletteOpen(true)}
            style={{ marginBottom: 4, justifyContent: "flex-start", paddingLeft: 10 }}
          >
            <Search size={13} style={{ color: "var(--vg-text-3)" }} />
            <span style={{ color: "var(--vg-text-3)", flex: 1, textAlign: "left" }}>
              Search workspace
            </span>
            <span className="ws-kbd">⌘K</span>
          </button>
        ) : null}

        <button
          type="button"
          className="ws-btn ws-btn--primary ws-btn--block"
          style={{ marginTop: 8 }}
          onClick={() => openCreateIssue({})}
        >
          <Plus size={14} />
          {!collapsed ? "New issue" : null}
        </button>

        {NAV.map((group) => (
          <nav key={group.id} className="ws-nav-group" aria-label={group.label}>
            {!collapsed ? (
              <div className="ws-nav-group__title">
                <span className="ws-label">{group.label}</span>
              </div>
            ) : null}
            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const count = badgeValue(item.badge);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="ws-nav-item"
                  data-active={active}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  style={collapsed ? { justifyContent: "center", padding: 0 } : undefined}
                >
                  <Icon size={15} />
                  {!collapsed ? <span>{item.label}</span> : null}
                  {!collapsed && count ? (
                    <span className="ws-nav-item__badge">{count}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        ))}

        <nav className="ws-nav-group" aria-label="Projects">
          {!collapsed ? (
            <div className="ws-nav-group__title">
              <span className="ws-label">Projects</span>
            </div>
          ) : null}
          {state.projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="ws-nav-item"
              onClick={() => {
                navigate(`/issues?project=${project.key}`);
                onNavigate?.();
              }}
              title={collapsed ? project.name : undefined}
              style={collapsed ? { justifyContent: "center", padding: 0 } : undefined}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  flexShrink: 0,
                  borderRadius: 2,
                  background:
                    project.tone === "ember"
                      ? "var(--vg-ember)"
                      : project.tone === "info"
                        ? "#38bdf8"
                        : "#4ade80",
                  boxShadow:
                    project.tone === "ember" ? "0 0 8px var(--vg-ember-glow)" : "none",
                }}
              />
              {!collapsed ? (
                <>
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.name}
                  </span>
                  <span
                    className="ws-nav-item__badge"
                    style={{ border: 0, background: "transparent", color: "var(--vg-text-4)" }}
                  >
                    {project.key}
                  </span>
                </>
              ) : null}
            </button>
          ))}
        </nav>

        {!collapsed ? (
          <div style={{ marginTop: 18 }}>
            <div className="ws-label" style={{ padding: "0 8px 8px" }}>
              Sprint 24
            </div>
            <div
              className="ws-panel"
              style={{ padding: "10px 11px", background: "#08080a" }}
            >
              {(() => {
                const sprintIssues = state.issues.filter(
                  (issue) => issue.sprintId === "sprint-24",
                );
                const done = sprintIssues.filter((issue) => issue.status === "done").length;
                const pct = sprintIssues.length
                  ? Math.round((done / sprintIssues.length) * 100)
                  : 0;
                return (
                  <>
                    <div className="ws-row" style={{ marginBottom: 7 }}>
                      <span style={{ fontSize: 10.5, color: "var(--vg-text-2)" }}>
                        Reliability
                      </span>
                      <span className="ws-spacer" />
                      <span className="ws-mono" style={{ fontSize: 10, color: "var(--vg-text-3)" }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="ws-meter ws-meter--thin">
                      <div className="ws-meter__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ fontSize: 9.5, color: "var(--vg-text-4)", marginTop: 7 }}>
                      {done}/{sprintIssues.length} shipped · 5 days left
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : null}
      </div>

      <div className="ws-sidebar__foot">
        <UserMenu collapsed={collapsed} />
      </div>
    </>
  );
}

function UserMenu({ collapsed }) {
  const { me, resetDemo } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(() => setOpen(false));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="ws-user-card"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        style={collapsed ? { justifyContent: "center" } : undefined}
      >
        <Avatar member={me} size="sm" />
        {!collapsed ? (
          <>
            <span className="ws-user-card__meta" style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--vg-font-display)",
                  fontSize: 11.5,
                  color: "var(--vg-text)",
                }}
              >
                {me.name}
              </span>
              <span style={{ display: "block", fontSize: 9.5, color: "var(--vg-text-3)" }}>
                {me.role}
              </span>
            </span>
                      </>
        ) : null}
      </button>

      {open ? (
        <div
          className="ws-panel ws-corners"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            width: 236,
            zIndex: 40,
            padding: 6,
            boxShadow: "0 30px 60px -30px #000",
          }}
        >
          <div style={{ padding: "8px 8px 10px" }}>
            <div style={{ fontSize: 12, color: "#fff" }}>{me.name}</div>
            <div style={{ fontSize: 10, color: "var(--vg-text-3)" }}>@{me.handle}</div>
          </div>
          <button
            type="button"
            className="ws-nav-item"
            onClick={() => {
              resetDemo();
              setOpen(false);
            }}
          >
            <RotateCcw size={14} />
            Reset demo data
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NotificationsMenu() {
  const { state, readNotifications } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(() => setOpen(false));
  const unread = state.notifications.filter((item) => !item.read).length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="ws-btn ws-btn--icon"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) readNotifications();
        }}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        style={{ position: "relative" }}
      >
        <Bell size={14} />
        {unread ? (
          <span
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 6,
              height: 6,
              borderRadius: 99,
              background: "var(--vg-ember)",
              boxShadow: "0 0 8px var(--vg-ember-glow)",
            }}
          />
        ) : null}
      </button>

      {open ? (
        <div
          className="ws-panel ws-corners"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            zIndex: 50,
            boxShadow: "0 30px 60px -30px #000",
            overflow: "hidden",
          }}
        >
          <div className="ws-panel__head" style={{ minHeight: 40 }}>
            <span className="ws-label">Signal</span>
            <span className="ws-spacer" />
            <Tag tone="ember">{unread || 0} new</Tag>
          </div>
          <div style={{ padding: 6, maxHeight: 320, overflowY: "auto" }} className="ws-scroll">
            {state.notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: 9,
                  padding: "9px 8px",
                  borderRadius: 6,
                  opacity: item.read ? 0.55 : 1,
                }}
              >
                <span
                  className="ws-dot"
                  style={{
                    marginTop: 5,
                    color:
                      item.tone === "ember"
                        ? "var(--vg-ember)"
                        : item.tone === "ok"
                          ? "var(--vg-ok)"
                          : "var(--vg-info)",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, color: "var(--vg-text)" }}>{item.title}</div>
                  <div style={{ fontSize: 10, color: "var(--vg-text-3)", marginTop: 2 }}>
                    {item.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Topbar({ onMenu, onCreate }) {
  const { setPaletteOpen } = useUi();
  const { pathname } = useLocation();
  const crumb = pathname === "/" ? "overview" : pathname.replace("/", "");

  return (
    <header className="ws-topbar">
      <button
        type="button"
        className="ws-btn ws-btn--icon ws-mobile-only"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu size={15} />
      </button>
      <Brand />
      <span className="ws-hidden-mobile" style={{ color: "var(--vg-text-4)" }}>/</span>
      <span
        className="ws-hidden-mobile"
        style={{ fontSize: 11, color: "var(--vg-text-3)", letterSpacing: "0.02em" }}
      >
        {crumb}
      </span>

      <span className="ws-spacer" />

      <button type="button" className="ws-search-trigger" onClick={() => setPaletteOpen(true)}>
        <Search size={13} />
        <span>Search issues, channels, people…</span>
        <span className="ws-kbd">⌘K</span>
      </button>

      <span className="ws-spacer" />

      <div className="ws-row ws-hidden-mobile" style={{ gap: 4 }}>
        <span
          className="ws-chip"
          style={{ height: 24, cursor: "default", color: "var(--vg-text-3)" }}
          title="Workspace watchers"
        >
          <Command size={11} />
          Watch 128
        </span>
      </div>

      <button
        type="button"
        className="ws-btn ws-btn--primary ws-btn--sm ws-hidden-mobile"
        onClick={onCreate}
      >
        <Plus size={13} />
        New
      </button>

      <NotificationsMenu />

    </header>
  );
}

function StatusBar() {
  return (
    <div className="ws-statusbar" aria-hidden="true">
      <span>
        <span className="ws-statusbar__dot" />
        demo workspace
      </span>
      <span className="ws-status-sep">│</span>
      <span>sprint 24 · day 8 of 12</span>
      <span className="ws-status-sep">│</span>
      <span>3 modules sync’d</span>
      <span className="ws-statusbar__spacer" />
      <span>⌘K commands</span>
      <span className="ws-status-sep">│</span>
      <span>c new issue</span>
      <span className="ws-status-sep">│</span>
      <span>p95 238ms</span>
      <span className="ws-status-sep">│</span>
      <span style={{ color: "var(--vg-text-4)" }}>v2.4.0</span>
    </div>
  );
}

function MobileNav({ open, onClose }) {
  const { setPaletteOpen } = useUi();
  if (!open) return null;
  return (
    <div className="ws-portal">
      <div className="ws-scrim" onClick={onClose} role="presentation" />
      <aside
        className="ws-sidebar"
        style={{ position: "fixed", inset: "0 auto 0 0", zIndex: 95, width: 260 }}
      >
        <div className="ws-sidebar__head">
          <div className="ws-row">
            <Brand />
            <span className="ws-spacer" />
            <button type="button" className="ws-btn ws-btn--icon" onClick={onClose} aria-label="Close navigation">
              <X size={14} />
            </button>
          </div>
        </div>
        <Sidebar collapsed={false} onNavigate={onClose} />
        <div style={{ padding: 10 }}>
          <button
            type="button"
            className="ws-btn ws-btn--outline ws-btn--block"
            onClick={() => {
              onClose();
              setPaletteOpen(true);
            }}
          >
            <Search size={13} /> Search workspace
          </button>
        </div>
      </aside>
    </div>
  );
}

export function Shell({ children }) {
  const { resetDemo } = useWorkspace();
  const { openCreateIssue, mobileNavOpen, setMobileNavOpen } = useUi();
  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [narrowExpanded, setNarrowExpanded] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1180px)").matches,
  );
  const collapsed = narrowViewport ? !narrowExpanded : manualCollapsed;
  const toggleCollapsed = () =>
    narrowViewport
      ? setNarrowExpanded((value) => !value)
      : setManualCollapsed((value) => !value);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1180px)");
    const onChange = (event) => {
      setNarrowViewport(event.matches);
      setNarrowExpanded(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const onReset = () => resetDemo();
    window.addEventListener("ws:reset", onReset);
    return () => window.removeEventListener("ws:reset", onReset);
  }, [resetDemo]);

  return (
    <div className="ws-app">
      <div className="ws-field" />
      <aside className="ws-sidebar" data-collapsed={collapsed} aria-label="Workspace navigation">
        <Sidebar collapsed={collapsed} />
        <button
          type="button"
          className="ws-btn ws-btn--icon ws-hidden-mobile"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute",
            top: 18,
            right: -13,
            zIndex: 25,
            width: 26,
            height: 26,
            borderRadius: 99,
            background: "#0b0b0e",
          }}
        >
          {collapsed ? <ChevronsRight size={12} /> : <ChevronsLeft size={12} />}
        </button>
      </aside>

      <div className="ws-shell">
        <Topbar
          onMenu={() => setMobileNavOpen(true)}
          onCreate={() => openCreateIssue({})}
        />
        <div className="ws-body">{children}</div>
        <StatusBar />
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
}

export default Shell;
