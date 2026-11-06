import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bug,
  CheckCircle2,
  Hash,
  Kanban,
  MessageSquare,
  Power,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useWorkspace } from "../store/useWorkspace.js";
import { useUi } from "../store/useUi.js";
import { Avatar, Chip, EmptyState, Tag } from "../components/ui.jsx";
import { dayLabel, relativeTime } from "../lib/format.js";

const MODULES = [
  { id: "all", label: "All signal", icon: Activity },
  { id: "slack", label: "Slack", icon: MessageSquare },
  { id: "trello", label: "Trello", icon: Kanban },
  { id: "jira", label: "Jira", icon: Bug },
];

const MODULE_ICON = {
  slack: MessageSquare,
  trello: Kanban,
  jira: Bug,
};

export function PulsePage() {
  const { state, memberById, toggleIntegration, resetDemo } = useWorkspace();
  const { openIssue, openCreateIssue } = useUi();
  const [module, setModule] = useState("all");

  const entries = useMemo(
    () =>
      state.activity.filter((entry) => module === "all" || entry.module === module),
    [state.activity, module],
  );

  const groups = useMemo(() => {
    const output = [];
    entries.forEach((entry) => {
      const label = dayLabel(entry.at);
      const last = output[output.length - 1];
      if (last && last.label === label) last.entries.push(entry);
      else output.push({ label, entries: [entry] });
    });
    return output;
  }, [entries]);

  const counts = {
    slack: state.activity.filter((entry) => entry.module === "slack").length,
    trello: state.activity.filter((entry) => entry.module === "trello").length,
    jira: state.activity.filter((entry) => entry.module === "jira").length,
  };

  return (
    <main className="ws-main ws-scroll">
      <header className="ws-page-header">
        <div className="ws-page-header__titles">
          <div className="ws-eyebrow">Unified activity · one event stream for three modules</div>
          <h1 className="ws-display ws-display--grad" style={{ fontSize: 34 }}>
            Pulse
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "var(--vg-text-2)" }}>
            Messages, cards, and issues write to the same ledger — so the story never splits.
          </p>
        </div>
        <div className="ws-row" style={{ gap: 8 }}>
          <button type="button" className="ws-btn ws-btn--outline" onClick={resetDemo}>
            <RotateCcw size={13} /> Reset demo
          </button>
          <button type="button" className="ws-btn ws-btn--primary" onClick={() => openCreateIssue({})}>
            <Zap size={13} /> File an issue
          </button>
        </div>
      </header>

      <div className="ws-row ws-row--wrap" style={{ gap: 8, marginBottom: 14 }}>
        {MODULES.map((item) => (
          <Chip key={item.id} active={module === item.id} onClick={() => setModule(item.id)}>
            <item.icon size={11} />
            {item.label}
            {item.id !== "all" ? (
              <span style={{ color: "var(--vg-text-4)" }}>{counts[item.id]}</span>
            ) : null}
          </Chip>
        ))}
        <span className="ws-spacer" />
        <Tag tone="ok">
          <span className="ws-dot" /> streaming
        </Tag>
      </div>

      <div className="ws-split ws-split--pulse">
        <section className="ws-panel">
          <div className="ws-panel__head">
            <Activity size={13} style={{ color: "var(--vg-text-2)" }} />
            <div className="ws-h3">Event stream</div>
            <span className="ws-spacer" />
            <span style={{ fontSize: 9.5, color: "var(--vg-text-4)" }}>
              {entries.length} events
            </span>
          </div>
          <div style={{ padding: "6px 14px 14px" }}>
            {groups.length ? (
              groups.map((group) => (
                <div key={group.label} style={{ marginBottom: 10 }}>
                  <div
                    className="ws-row"
                    style={{ gap: 10, margin: "12px 0 4px", fontSize: 9.5, color: "var(--vg-text-4)" }}
                  >
                    <span style={{ height: 1, flex: 1, background: "var(--vg-line)" }} />
                    {group.label}
                    <span style={{ height: 1, flex: 1, background: "var(--vg-line)" }} />
                  </div>
                  {group.entries.map((entry) => {
                    const actor = memberById[entry.actorId];
                    const Icon = MODULE_ICON[entry.module] || Activity;
                    return (
                      <div key={entry.id} className="ws-activity" style={{ gridTemplateColumns: "26px minmax(0,1fr) auto" }}>
                        <span className="ws-activity__icon" data-module={entry.module}>
                          <Icon size={12} />
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span className="ws-row" style={{ gap: 7, flexWrap: "wrap" }}>
                            <Avatar member={actor} size="sm" presence={false} />
                            <span style={{ color: "var(--vg-text)", fontSize: 11.5 }}>
                              {actor?.name}
                            </span>
                            <span>{entry.verb}</span>
                            <button
                              type="button"
                              className="ws-issue-ref"
                              onClick={() => {
                                if (/^[A-Z]{2,5}-\d+$/.test(entry.target)) openIssue(entry.target);
                              }}
                              style={{
                                border: 0,
                                background: "transparent",
                                padding: 0,
                                color: "var(--vg-ember-2)",
                              }}
                            >
                              {entry.target}
                            </button>
                          </span>
                          <span
                            style={{
                              display: "block",
                              marginTop: 2,
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
              ))
            ) : (
              <EmptyState
                title="No activity for this module yet"
                body="Make a change on a board, in a channel, or on an issue and it will land here."
              />
            )}
          </div>
        </section>

        <div style={{ display: "grid", gap: 14 }}>
          <section className="ws-panel">
            <div className="ws-panel__head">
              <ShieldCheck size={13} style={{ color: "var(--vg-ok)" }} />
              <div className="ws-h3">Module bridges</div>
              <span className="ws-spacer" />
              <Tag tone="ok">3 live</Tag>
            </div>
            <div style={{ padding: 12, display: "grid", gap: 8 }}>
              {state.integrations.map((integration) => {
                const connected = integration.status === "connected";
                return (
                  <div
                    key={integration.id}
                    className="ws-panel"
                    style={{ padding: "10px 11px", background: "#08080a" }}
                  >
                    <div className="ws-row" style={{ gap: 9 }}>
                      <span
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: 26,
                          height: 26,
                          border: "1px solid var(--vg-line)",
                          borderRadius: 6,
                          color: connected ? "var(--vg-ok)" : "var(--vg-text-3)",
                          background: connected ? "var(--vg-ok-soft)" : "transparent",
                        }}
                      >
                        <Power size={12} />
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "block", fontSize: 11.5, color: "var(--vg-text)" }}>
                          {integration.name}
                        </span>
                        <span style={{ display: "block", fontSize: 9.5, color: "var(--vg-text-3)" }}>
                          {integration.detail}
                        </span>
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={connected}
                        aria-label={`Toggle ${integration.name}`}
                        onClick={() => toggleIntegration(integration.id)}
                        className="ws-btn ws-btn--sm"
                        style={{
                          width: 38,
                          padding: 0,
                          height: 20,
                          borderRadius: 999,
                          borderColor: connected ? "var(--vg-ember-line)" : "var(--vg-line)",
                          background: connected ? "var(--vg-ember-soft)" : "#0c0c0f",
                          justifyContent: connected ? "flex-end" : "flex-start",
                          paddingInline: 2,
                        }}
                      >
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 99,
                            background: connected ? "var(--vg-ember)" : "var(--vg-text-4)",
                            boxShadow: connected ? "0 0 10px var(--vg-ember-glow)" : "none",
                          }}
                        />
                      </button>
                    </div>
                    <div
                      className="ws-row"
                      style={{ marginTop: 7, fontSize: 9, color: "var(--vg-text-4)", gap: 8 }}
                    >
                      <span>{connected ? "connected" : "paused"}</span>
                      <span>·</span>
                      <span>
                        {integration.syncedAt ? `synced ${relativeTime(integration.syncedAt)}` : "never synced"}
                      </span>
                      {connected ? (
                        <span className="ws-row" style={{ gap: 4, marginLeft: "auto", color: "var(--vg-ok)" }}>
                          <CheckCircle2 size={9} /> healthy
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="ws-panel">
            <div className="ws-panel__head">
              <Hash size={13} style={{ color: "var(--vg-info)" }} />
              <div className="ws-h3">How the modules connect</div>
            </div>
            <div style={{ padding: "10px 14px 14px", display: "grid", gap: 10, fontSize: 10.5, color: "var(--vg-text-2)" }}>
              <div className="ws-row" style={{ gap: 8 }}>
                <MessageSquare size={12} style={{ color: "var(--vg-info)" }} />
                <span style={{ flex: 1 }}>A message becomes an issue</span>
                <ArrowRight size={11} style={{ color: "var(--vg-text-4)" }} />
                <Bug size={12} style={{ color: "var(--vg-ember)" }} />
              </div>
              <div className="ws-row" style={{ gap: 8 }}>
                <Bug size={12} style={{ color: "var(--vg-ember)" }} />
                <span style={{ flex: 1 }}>An issue renders as a card</span>
                <ArrowRight size={11} style={{ color: "var(--vg-text-4)" }} />
                <Kanban size={12} style={{ color: "var(--vg-ok)" }} />
              </div>
              <div className="ws-row" style={{ gap: 8 }}>
                <Kanban size={12} style={{ color: "var(--vg-ok)" }} />
                <span style={{ flex: 1 }}>A card move updates the issue</span>
                <ArrowRight size={11} style={{ color: "var(--vg-text-4)" }} />
                <Activity size={12} style={{ color: "var(--vg-text-2)" }} />
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--vg-text-4)", lineHeight: 1.7 }}>
                One record, three surfaces. Nothing is duplicated, so the board, the ticket, and
                the conversation can never disagree.
              </p>
            </div>
          </section>

          <section className="ws-panel">
            <div className="ws-panel__head">
              <Zap size={13} style={{ color: "var(--vg-ember)" }} />
              <div className="ws-h3">Shortcuts</div>
            </div>
            <div style={{ padding: "10px 14px 14px", display: "grid", gap: 8, fontSize: 10.5 }}>
              {[
                ["⌘ K", "Command palette"],
                ["c", "Create issue"],
                ["g b", "Jump to boards"],
                ["g i", "Jump to issues"],
                ["g c", "Jump to channels"],
              ].map(([keys, label]) => (
                <div key={label} className="ws-row" style={{ gap: 8 }}>
                  <span className="ws-kbd" style={{ minWidth: 26 }}>
                    {keys}
                  </span>
                  <span style={{ color: "var(--vg-text-3)" }}>{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default PulsePage;
