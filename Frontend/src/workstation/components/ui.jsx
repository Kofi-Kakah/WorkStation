import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ArrowUpRight, Info, X } from "lucide-react";
import { initials } from "../lib/format.js";
import { useWorkspace } from "../store/useWorkspace.js";
import { useSpotlight } from "../lib/useSpotlight.js";

export function Spot({ as: As = "div", className = "", children, ...rest }) {
  const { ref, onPointerMove } = useSpotlight();
  return (
    <As
      ref={ref}
      onPointerMove={onPointerMove}
      className={`ws-spot ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

export function Avatar({ member, size = "md", presence = true, className = "" }) {
  if (!member) {
    return <span className={`ws-avatar ${className}`} aria-hidden="true">?</span>;
  }
  const sizeClass = size === "sm" ? "ws-avatar--sm" : size === "lg" ? "ws-avatar--lg" : "";
  const tone = member.tone && member.tone !== "neutral" ? `ws-avatar--${member.tone}` : "";
  return (
    <span
      className={`ws-avatar ${sizeClass} ${tone} ${className}`}
      title={`${member.name} · ${member.role}`}
    >
      {initials(member.name)}
      {presence && member.status ? (
        <span
          className={`ws-presence ${
            member.status === "away"
              ? "ws-presence--away"
              : member.status === "offline"
                ? "ws-presence--off"
                : ""
          }`}
        />
      ) : null}
    </span>
  );
}

export function AvatarStack({ members = [], max = 4, size = "sm" }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  if (!members.length) {
    return <span className="ws-faint" style={{ fontSize: 10 }}>unassigned</span>;
  }
  return (
    <span className="ws-avatar-stack">
      {shown.map((member) => (
        <Avatar key={member.id} member={member} size={size} presence={false} />
      ))}
      {extra > 0 ? (
        <span className="ws-avatar ws-avatar--sm" style={{ background: "#111" }}>
          +{extra}
        </span>
      ) : null}
    </span>
  );
}

export function Tag({ tone = "neutral", children, className = "", ...rest }) {
  return (
    <span
      className={`ws-tag ${tone !== "neutral" ? `ws-tag--${tone}` : ""} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

export function Chip({ active = false, children, className = "", ...rest }) {
  return (
    <button type="button" className={`ws-chip ${className}`} data-active={active} {...rest}>
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Data display                                                               */
/* -------------------------------------------------------------------------- */

export function Meter({ value, total, tone = "ember", thin = false, label }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div
      className={`ws-meter ${thin ? "ws-meter--thin" : ""} ${
        tone === "ok" ? "ws-meter--ok" : ""
      }`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="ws-meter__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Sparkline({ points = [], width = 120, height = 30, tone = "ember" }) {
  if (!points.length) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = width / Math.max(1, points.length - 1);
  const coords = points.map((point, index) => {
    const x = index * step;
    const y = height - 3 - ((point - min) / span) * (height - 6);
    return [x, y];
  });
  const path = coords
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const color = tone === "ok" ? "#4ade80" : "#ff5a43";
  const id = `spark-${tone}-${points.join("-").length}-${Math.round(points[0])}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function RingGauge({ value, total, size = 84, label, caption }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-gradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)" }}
        />
        <defs>
          <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff8a5f" />
            <stop offset="100%" stopColor="#ff4433" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--vg-font-display)",
            fontSize: 18,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {pct}%
        </div>
        <div
          style={{
            fontSize: 8.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--vg-text-3)",
            marginTop: 3,
          }}
        >
          {caption || label}
        </div>
      </div>
    </div>
  );
}

export function TypeIcon({ type }) {
  const glyph = { bug: "B", story: "S", task: "T", epic: "E" }[type] || "T";
  return (
    <span className="ws-type-icon" data-type={type} title={type}>
      {glyph}
    </span>
  );
}

export function PriorityMark({ priority }) {
  const copy = { critical: "!!", high: "!", medium: "=", low: "↓" }[priority] || "=";
  return (
    <span className="ws-priority" data-p={priority} title={`${priority} priority`}>
      {copy}
    </span>
  );
}

export function SectionHead({ title, action, subtitle }) {
  return (
    <div className="ws-row" style={{ marginBottom: 12 }}>
      <div style={{ minWidth: 0 }}>
        <h2 className="ws-h2">{title}</h2>
        {subtitle ? (
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--vg-text-3)" }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      <span className="ws-spacer" />
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon = Info, title, body, action }) {
  return (
    <div className="ws-empty">
      <Icon size={18} strokeWidth={1.5} />
      <strong style={{ color: "var(--vg-text-2)", fontSize: 12 }}>{title}</strong>
      {body ? <span style={{ maxWidth: 320 }}>{body}</span> : null}
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Overlays                                                                   */
/* -------------------------------------------------------------------------- */

function useLockBody(active) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

export function Drawer({ open, onClose, title, subtitle, actions, children, footer, wide = false }) {
  const titleId = useId();
  useLockBody(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="ws-portal">
      <div className="ws-scrim" onClick={onClose} role="presentation" />
      <aside
        className={`ws-drawer ${wide ? "ws-drawer--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="ws-drawer__head">
          <div style={{ minWidth: 0 }}>
            <h2 id={titleId} className="ws-h2" style={{ fontSize: 15 }}>
              {title}
            </h2>
            {subtitle ? (
              <div style={{ fontSize: 10.5, color: "var(--vg-text-3)", marginTop: 2 }}>
                {subtitle}
              </div>
            ) : null}
          </div>
          <span className="ws-spacer" />
          {actions}
          <button type="button" className="ws-btn ws-btn--icon" onClick={onClose} aria-label="Close panel">
            <X size={14} />
          </button>
        </header>
        <div className="ws-drawer__body ws-scroll">{children}</div>
        {footer ? <div className="ws-drawer__foot">{footer}</div> : null}
      </aside>
    </div>,
    document.body,
  );
}

export function Modal({ open, onClose, title, subtitle, actions, children, footer, width }) {
  const titleId = useId();
  useLockBody(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="ws-portal">
      <div className="ws-scrim" onClick={onClose} role="presentation" />
      <div className="ws-modal-wrap">
        <div
          className="ws-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={width ? { width } : undefined}
        >
          <header className="ws-modal__head">
            <div>
              <h2 id={titleId} className="ws-h2" style={{ fontSize: 15 }}>
                {title}
              </h2>
              {subtitle ? (
                <div style={{ fontSize: 10.5, color: "var(--vg-text-3)", marginTop: 2 }}>
                  {subtitle}
                </div>
              ) : null}
            </div>
            <span className="ws-spacer" />
            {actions}
            <button type="button" className="ws-btn ws-btn--icon" onClick={onClose} aria-label="Close dialog">
              <X size={14} />
            </button>
          </header>
          <div className="ws-modal__body">{children}</div>
          {footer ? <div className="ws-modal__foot">{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useWorkspace();
  if (!toasts.length) return null;
  return createPortal(
    <div className="ws-portal">
      <div className="ws-toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="ws-toast">
            <span className="ws-toast__icon">
              {toast.tone === "warn" ? <AlertTriangle size={12} /> : <ArrowUpRight size={12} />}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{toast.title}</b>
              <span>{toast.body}</span>
            </div>
            <button
              type="button"
              className="ws-msg__action"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* Message rendering                                                          */
/* -------------------------------------------------------------------------- */

const TOKEN = /(@[a-z0-9._-]+|#[a-z0-9-]+|[A-Z]{2,5}-\d+|\*\*[^*]+\*\*|`[^`]+`)/gi;

/**
 * Lightweight inline formatter for Slack-style messages: @mentions, #channels,
 * issue keys, **bold**, and `code`. Issue keys call back so the UI can open
 * the linked issue from anywhere in the workspace.
 */
export function RichText({ text = "", onIssue }) {
  const parts = String(text).split(TOKEN);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith("@")) {
          return (
            <span key={index} className="ws-mention">
              {part}
            </span>
          );
        }
        if (part.startsWith("#")) {
          return (
            <span key={index} className="ws-channel-ref">
              {part}
            </span>
          );
        }
        if (/^[A-Z]{2,5}-\d+$/.test(part)) {
          return (
            <button
              key={index}
              type="button"
              className="ws-issue-ref"
              onClick={() => onIssue?.(part)}
            >
              {part}
            </button>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="ws-code">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
