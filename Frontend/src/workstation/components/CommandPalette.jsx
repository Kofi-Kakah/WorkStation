import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bug,
  Hash,
  Kanban,
  LayoutDashboard,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { useWorkspace } from "../store/useWorkspace.js";
import { useUi } from "../store/useUi.js";
import { TypeIcon } from "./ui.jsx";

const ACTIONS = [
  { id: "action-new-issue", label: "Create a new issue", hint: "c", icon: Plus, kind: "action" },
  { id: "nav-issues", label: "Go to Issues", hint: "issue tracker", icon: Bug, to: "/issues" },
  { id: "nav-boards", label: "Go to Boards", hint: "kanban", icon: Kanban, to: "/boards" },
  { id: "nav-channels", label: "Go to Channels", hint: "messages", icon: Hash, to: "/channels" },
  { id: "nav-pulse", label: "Go to Pulse", hint: "activity", icon: Activity, to: "/pulse" },
  { id: "nav-overview", label: "Go to Overview", hint: "dashboard", icon: LayoutDashboard, to: "/" },
];

function Highlight({ text, term }) {
  if (!term) return text;
  const index = text.toLowerCase().indexOf(term.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + term.length)}</mark>
      {text.slice(index + term.length)}
    </>
  );
}

function PalettePanel({ onClose }) {
  const { state } = useWorkspace();
  const { openIssue, openCreateIssue } = useUi();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const results = useMemo(() => {
    const search = term.trim().toLowerCase();
    const matches = (value) => String(value || "").toLowerCase().includes(search);

    const actions = ACTIONS.filter(
      (action) => !search || matches(action.label) || matches(action.hint),
    ).slice(0, search ? 4 : 3);

    const issues = state.issues
      .filter((issue) => !search || matches(issue.title) || matches(issue.id))
      .slice(0, search ? 5 : 4)
      .map((issue) => ({ type: "issue", id: issue.id, issue }));

    const channels = state.channels
      .filter((channel) => !search || matches(channel.name) || matches(channel.topic))
      .slice(0, 3)
      .map((channel) => ({ type: "channel", id: channel.id, channel }));

    const people = state.members
      .filter((member) => search && (matches(member.name) || matches(member.handle)))
      .slice(0, 3)
      .map((member) => ({ type: "member", id: member.id, member }));

    return [
      { group: "Actions", items: actions },
      { group: "Issues", items: issues },
      { group: "Channels", items: channels },
      { group: "People", items: people },
    ].filter((section) => section.items.length);
  }, [state, term]);

  const flat = useMemo(() => results.flatMap((section) => section.items), [results]);
  const safeSelected = Math.min(selected, Math.max(0, flat.length - 1));

  useEffect(() => {
    const node = listRef.current?.querySelector('[data-selected="true"]');
    node?.scrollIntoView({ block: "nearest" });
  }, [safeSelected]);

  const run = (item) => {
    if (!item) return;
    onClose();
    if (item.kind === "action") {
      if (item.id === "action-new-issue") {
        openCreateIssue({});
        return;
      }
      if (item.to) navigate(item.to);
      return;
    }
    if (item.type === "issue") {
      openIssue(item.id);
      return;
    }
    if (item.type === "channel") {
      navigate(`/channels?c=${item.channel.id}`);
      return;
    }
    if (item.type === "member") {
      navigate(`/channels?c=dm-${item.member.id}`);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((current) => (current + 1) % Math.max(1, flat.length));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected(
        (current) => (current - 1 + Math.max(1, flat.length)) % Math.max(1, flat.length),
      );
    }
    if (event.key === "Enter") {
      event.preventDefault();
      run(flat[safeSelected]);
    }
  };

  let cursor = -1;

  return (
    <div className="ws-portal">
      <div className="ws-scrim" onClick={onClose} role="presentation" />
      <div className="ws-modal-wrap" style={{ paddingTop: "12vh" }}>
        <div className="ws-palette" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="ws-palette__input">
            <Search size={15} style={{ color: "var(--vg-text-3)" }} />
            <input
              ref={inputRef}
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setSelected(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search issues, channels, people, or run a command…"
              aria-label="Search workspace"
            />
            <span className="ws-kbd">esc</span>
          </div>

          <div className="ws-palette__list ws-scroll" ref={listRef}>
            {results.map((section) => (
              <div key={section.group}>
                <div className="ws-palette__group-title">
                  <span className="ws-label">{section.group}</span>
                </div>
                {section.items.map((item) => {
                  cursor += 1;
                  const index = cursor;
                  const isSelected = index === safeSelected;
                  const icon =
                    item.type === "issue" ? (
                      <TypeIcon type={item.issue.type} />
                    ) : item.type === "channel" ? (
                      <Hash size={13} style={{ color: "var(--vg-info)" }} />
                    ) : item.type === "member" ? (
                      <UserRound size={13} />
                    ) : (
                      <item.icon size={13} />
                    );
                  return (
                    <button
                      key={`${section.group}-${item.id}`}
                      type="button"
                      className="ws-palette__item"
                      data-selected={isSelected}
                      onMouseEnter={() => setSelected(index)}
                      onClick={() => run(item)}
                    >
                      <span
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: 18,
                          color: "var(--vg-text-3)",
                        }}
                      >
                        {icon}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.type === "issue" ? (
                          <>
                            <span style={{ color: "var(--vg-text-3)", marginRight: 8 }}>
                              {item.issue.id}
                            </span>
                            <Highlight text={item.issue.title} term={term} />
                          </>
                        ) : item.type === "channel" ? (
                          <>#{item.channel.name}</>
                        ) : item.type === "member" ? (
                          <>
                            <Highlight text={item.member.name} term={term} />
                            <span style={{ color: "var(--vg-text-4)", marginLeft: 8 }}>
                              @{item.member.handle}
                            </span>
                          </>
                        ) : (
                          <Highlight text={item.label} term={term} />
                        )}
                      </span>
                      {item.type === "issue" ? (
                        <span className="ws-tag" style={{ height: 17 }}>
                          {item.issue.status.replace("_", " ")}
                        </span>
                      ) : item.hint ? (
                        <span style={{ fontSize: 9.5, color: "var(--vg-text-4)" }}>{item.hint}</span>
                      ) : null}
                      {isSelected ? (
                        <ArrowRight size={12} style={{ color: "var(--vg-text-3)" }} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
            {!flat.length ? (
              <div style={{ padding: "26px 10px", textAlign: "center", color: "var(--vg-text-3)" }}>
                No matches for “{term}”. Try an issue key like ORB-142.
              </div>
            ) : null}
          </div>

          <div className="ws-palette__hint">
            <span className="ws-row" style={{ gap: 4 }}>
              <span className="ws-kbd">↑</span>
              <span className="ws-kbd">↓</span> navigate
            </span>
            <span className="ws-row" style={{ gap: 4 }}>
              <span className="ws-kbd">↵</span> open
            </span>
            <span className="ws-spacer" />
            <span>{flat.length} results</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useUi();
  if (!paletteOpen) return null;
  return <PalettePanel onClose={() => setPaletteOpen(false)} />;
}

export default CommandPalette;
