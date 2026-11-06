import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AtSign,
  Bookmark,
  Bug,
  Hash,
  Info,
  MessageSquare,
  Paperclip,
  Plus,
  Reply,
  Search,
  Send,
  SmilePlus,
  Users,
  X,
} from "lucide-react";
import { useWorkspace } from "../store/useWorkspace.js";
import { useUi } from "../store/useUi.js";
import {
  Avatar,
  AvatarStack,
  RichText,
  Tag,
} from "../components/ui.jsx";
import { dayLabel, relativeTime, timeOfDay } from "../lib/format.js";

const QUICK_EMOJI = ["🔥", "✅", "👀", "🚀", "🤝", "🙏"];

function ChannelList({ channels, dms, activeId, onSelect, memberById, me }) {
  const [filter, setFilter] = useState("");
  const term = filter.trim().toLowerCase();

  const visibleChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(term),
  );
  const visibleDms = dms.filter((dm) =>
    (memberById[dm.withId]?.name || "").toLowerCase().includes(term),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      <div style={{ padding: "10px 10px 6px" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={11}
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--vg-text-4)",
            }}
          />
          <input
            className="ws-input"
            placeholder="Find a conversation"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            style={{ height: 28, paddingLeft: 26, fontSize: 11 }}
            aria-label="Find a conversation"
          />
        </div>
      </div>

      <div className="ws-scroll" style={{ overflowY: "auto", flex: 1, padding: "0 8px 10px" }}>
        <div className="ws-nav-group__title" style={{ padding: "10px 6px 6px" }}>
          <span className="ws-label">Channels</span>
          <span style={{ fontSize: 9.5, color: "var(--vg-text-4)" }}>{channels.length}</span>
        </div>
        {visibleChannels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className="ws-nav-item"
            data-active={channel.id === activeId}
            onClick={() => onSelect(channel.id)}
            style={{ height: 32 }}
          >
            <Hash size={13} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {channel.name}
            </span>
            {channel.unread ? (
              <span
                className="ws-nav-item__badge"
                style={{
                  borderColor: "var(--vg-ember-line)",
                  background: "var(--vg-ember-soft)",
                  color: "#ffb3a2",
                }}
              >
                {channel.unread}
              </span>
            ) : null}
          </button>
        ))}

        <div className="ws-nav-group__title" style={{ padding: "14px 6px 6px" }}>
          <span className="ws-label">Direct messages</span>
          <span style={{ fontSize: 9.5, color: "var(--vg-text-4)" }}>{dms.length}</span>
        </div>
        {visibleDms.map((dm) => {
          const person = memberById[dm.withId];
          return (
            <button
              key={dm.id}
              type="button"
              className="ws-nav-item"
              data-active={dm.id === activeId}
              onClick={() => onSelect(dm.id)}
              style={{ height: 34 }}
            >
              <Avatar member={person} size="sm" />
              <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {person?.name}
              </span>
              {dm.unread ? (
                <span className="ws-nav-item__badge" style={{ borderColor: "var(--vg-ember-line)", background: "var(--vg-ember-soft)", color: "#ffb3a2" }}>
                  {dm.unread}
                </span>
              ) : null}
            </button>
          );
        })}

        <div style={{ marginTop: 14, padding: "0 4px" }}>
          <div className="ws-label" style={{ marginBottom: 6, fontSize: 9 }}>
            Presence
          </div>
          <div className="ws-row" style={{ gap: 8 }}>
            <AvatarStack
              members={channels
                .flatMap((channel) => channel.memberIds)
                .filter((id, index, all) => all.indexOf(id) === index)
                .map((id) => memberById[id])
                .filter((member) => member && member.status === "online")}
              max={5}
            />
            <span style={{ fontSize: 9.5, color: "var(--vg-text-4)" }}>
              online now
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 9.5, color: "var(--vg-text-4)" }}>
            Signed in as @{me.handle}
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({ message, channel, parentId, onIssue, onReply, onReact, onCreateIssue }) {
  const { memberById, me } = useWorkspace();
  const author = memberById[message.authorId];
  const [emojiOpen, setEmojiOpen] = useState(false);

  return (
    <div className="ws-msg" id={message.id}>
      <Avatar member={author} size="md" presence={false} />
      <div style={{ minWidth: 0 }}>
        <div className="ws-msg__head">
          <span className="ws-msg__name">{author?.name}</span>
          <span className="ws-msg__time">{timeOfDay(message.at)}</span>
          {message.authorId === me.id ? (
            <span className="ws-tag" style={{ height: 15, padding: "0 4px", fontSize: 8 }}>
              you
            </span>
          ) : null}
        </div>
        <div className="ws-msg__body">
          <RichText text={message.body} onIssue={onIssue} />
        </div>

        {message.reactions.length ? (
          <div className="ws-reactions">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                className="ws-reaction"
                data-mine={reaction.memberIds.includes(me.id)}
                onClick={() => onReact(message.id, reaction.emoji, parentId)}
                title={reaction.memberIds.map((id) => memberById[id]?.name).join(", ")}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.memberIds.length}</span>
              </button>
            ))}
          </div>
        ) : null}

        {message.replies.length && !parentId ? (
          <button
            type="button"
            className="ws-row"
            onClick={() => onReply(message)}
            style={{
              marginTop: 7,
              gap: 6,
              border: 0,
              background: "transparent",
              color: "var(--vg-info)",
              fontSize: 10.5,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Reply size={11} />
            {message.replies.length} {message.replies.length === 1 ? "reply" : "replies"}
            <span style={{ color: "var(--vg-text-4)" }}>
              · last {relativeTime(message.replies[message.replies.length - 1].at)}
            </span>
          </button>
        ) : null}
      </div>

      <div className="ws-msg__actions">
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="ws-msg__action"
            onClick={() => setEmojiOpen((value) => !value)}
            aria-label="Add reaction"
            title="Add reaction"
          >
            <SmilePlus size={12} />
          </button>
          {emojiOpen ? (
            <div
              className="ws-panel"
              style={{
                position: "absolute",
                bottom: "calc(100% + 6px)",
                right: 0,
                display: "flex",
                gap: 2,
                padding: 4,
                zIndex: 20,
              }}
            >
              {QUICK_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="ws-msg__action"
                  onClick={() => {
                    onReact(message.id, emoji, parentId);
                    setEmojiOpen(false);
                  }}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="ws-msg__action"
          onClick={() => onReply(message)}
          aria-label="Reply in thread"
          title="Reply in thread"
        >
          <Reply size={12} />
        </button>
        {!parentId ? (
          <button
            type="button"
            className="ws-msg__action"
            onClick={() => onCreateIssue(channel.id, message.id)}
            aria-label="Create issue from message"
            title="Create issue from message"
          >
            <Bug size={12} />
          </button>
        ) : null}
        <button
          type="button"
          className="ws-msg__action"
          aria-label="Save message"
          title="Save message"
        >
          <Bookmark size={12} />
        </button>
      </div>
    </div>
  );
}

function Composer({ onSend, placeholder, compact = false }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const submit = () => {
    const body = value.trim();
    if (!body) return;
    onSend(body);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  return (
    <div className="ws-composer" style={compact ? { padding: "8px 0 0" } : undefined}>
      <div className="ws-composer__box">
        <textarea
          ref={textareaRef}
          value={value}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => {
            setValue(event.target.value);
            const node = event.target;
            node.style.height = "auto";
            node.style.height = `${Math.min(140, node.scrollHeight)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
        />
        <div className="ws-composer__bar">
          <button type="button" className="ws-msg__action" aria-label="Attach a file" title="Attach a file">
            <Paperclip size={12} />
          </button>
          <button type="button" className="ws-msg__action" aria-label="Mention someone" title="Mention someone">
            <AtSign size={12} />
          </button>
          <span
            style={{
              fontSize: 9.5,
              color: "var(--vg-text-4)",
              marginLeft: 4,
              display: compact ? "none" : "inline",
            }}
          >
            Shift + ↵ for a new line
          </span>
          <span className="ws-spacer" />
          <button
            type="button"
            className="ws-btn ws-btn--primary ws-btn--sm"
            onClick={submit}
            disabled={!value.trim()}
          >
            <Send size={11} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChannelsPage() {
  const {
    state,
    me,
    memberById,
    sendMessage,
    react,
    markChannelRead,
    createIssueFromMessage,
  } = useWorkspace();
  const { openIssue } = useUi();
  const [params, setParams] = useSearchParams();
  const [thread, setThread] = useState(null);
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef(null);

  const all = useMemo(() => [...state.channels, ...state.dms], [state.channels, state.dms]);
  const activeId = params.get("c") || "platform";
  const channel = all.find((item) => item.id === activeId) || state.channels[0];
  const dmPerson = state.dms.find((dm) => dm.id === channel.id);
  const person = dmPerson ? memberById[dmPerson.withId] : null;

  const title = dmPerson ? person?.name || "Direct message" : `#${channel.name}`;
  const topic = dmPerson ? `${person?.role} · direct message` : channel.topic;

  useEffect(() => {
    if (channel.unread) markChannelRead(channel.id);
  }, [channel.id, channel.unread, markChannelRead]);

  useEffect(() => {
    const node = messagesRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [channel.id, channel.messages.length]);

  // Lightweight presence simulation: a teammate is "typing" once in a while.
  useEffect(() => {
    let timeout;
    const interval = setInterval(() => {
      setTyping(true);
      timeout = setTimeout(() => setTyping(false), 4200);
    }, 18000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      setTyping(false);
    };
  }, [channel.id]);

  const members = (channel.memberIds || [channel.withId])
    .map((id) => memberById[id])
    .filter(Boolean);

  const selectChannel = (id) => {
    const next = new URLSearchParams(params);
    next.set("c", id);
    setParams(next);
  };

  const dayGroups = useMemo(() => {
    const groups = [];
    channel.messages.forEach((message) => {
      const label = dayLabel(message.at);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.messages.push(message);
      else groups.push({ label, messages: [message] });
    });
    return groups;
  }, [channel.messages]);

  const threadMessage =
    thread && thread.channelId === channel.id
      ? channel.messages.find((message) => message.id === thread.messageId) || null
      : null;

  const handleCreateIssue = (channelId, messageId) => {
    createIssueFromMessage(channelId, messageId);
  };

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, minWidth: 0 }}>
      <aside className="ws-chat-side" aria-label="Conversations">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 52,
            flexShrink: 0,
            padding: "0 12px",
            borderBottom: "1px solid var(--vg-line)",
          }}
        >
          <MessageSquare size={14} style={{ color: "var(--vg-ember)" }} />
          <div style={{ minWidth: 0 }}>
            <div className="ws-h3" style={{ fontSize: 12.5 }}>
              Messages
            </div>
            <div style={{ fontSize: 9, color: "var(--vg-text-4)" }}>
              {state.channels.length} channels · {state.dms.length} DMs
            </div>
          </div>
          <span className="ws-spacer" />
          <button type="button" className="ws-btn ws-btn--icon" style={{ width: 26, height: 26 }} aria-label="New conversation">
            <Plus size={12} />
          </button>
        </div>
        <ChannelList
          channels={state.channels}
          dms={state.dms}
          activeId={channel.id}
          onSelect={selectChannel}
          memberById={memberById}
          me={me}
        />
      </aside>

      <div className="ws-chat-main">
        <header className="ws-chat-head">
          <select
            className="ws-select ws-mobile-only"
            aria-label="Switch conversation"
            value={channel.id}
            onChange={(event) => selectChannel(event.target.value)}
            style={{ width: 140, height: 28, fontSize: 11 }}
          >
            {state.channels.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.name}
              </option>
            ))}
            {state.dms.map((item) => (
              <option key={item.id} value={item.id}>
                {memberById[item.withId]?.name}
              </option>
            ))}
          </select>
          <div style={{ minWidth: 0 }}>
            <div className="ws-row" style={{ gap: 8 }}>
              {dmPerson ? <Avatar member={person} size="sm" /> : <Hash size={14} style={{ color: "var(--vg-text-3)" }} />}
              <span
                style={{
                  fontFamily: "var(--vg-font-display)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {title}
              </span>
              {!dmPerson ? <Tag tone="info">channel</Tag> : <Tag tone="ok">direct</Tag>}
            </div>
            <div
              style={{
                fontSize: 9.5,
                color: "var(--vg-text-3)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "46vw",
              }}
            >
              {topic}
            </div>
          </div>
          <span className="ws-spacer" />
          <div className="ws-row ws-hidden-mobile" style={{ gap: 8 }}>
            <AvatarStack members={members} max={4} />
            <button type="button" className="ws-btn ws-btn--outline ws-btn--sm">
              <Users size={11} /> {members.length}
            </button>
          </div>
          <button type="button" className="ws-btn ws-btn--icon" aria-label="Channel details" title="Channel details">
            <Info size={13} />
          </button>
        </header>

        <div className="ws-messages ws-scroll" ref={messagesRef}>
          <div
            className="ws-panel"
            style={{
              padding: "14px 16px",
              marginBottom: 16,
              background:
                "linear-gradient(135deg, rgba(255,68,51,.06), rgba(255,255,255,.015))",
            }}
          >
            <div className="ws-row" style={{ gap: 9 }}>
              <Hash size={15} style={{ color: "var(--vg-ember)" }} />
              <div>
                <div className="ws-h3">
                  {dmPerson ? person?.name : `Welcome to #${channel.name}`}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--vg-text-3)", marginTop: 2 }}>
                  {dmPerson
                    ? "Direct messages are private. Capture one as an issue to share context."
                    : `This is the start of #${channel.name}. ${channel.memberIds.length} members.`}
                </div>
              </div>
            </div>
            <div className="ws-row" style={{ gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <Tag tone="ember">issue capture on</Tag>
              <Tag tone="info">mentions notify</Tag>
              <Tag>search indexed</Tag>
            </div>
          </div>

          {dayGroups.map((group) => (
            <div key={group.label}>
              <div
                className="ws-row"
                style={{ gap: 10, margin: "12px 0", fontSize: 9.5, color: "var(--vg-text-4)" }}
              >
                <span style={{ height: 1, flex: 1, background: "var(--vg-line)" }} />
                {group.label}
                <span style={{ height: 1, flex: 1, background: "var(--vg-line)" }} />
              </div>
              {group.messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  channel={channel}
                  onIssue={openIssue}
                  onReply={(item) => setThread({ channelId: channel.id, messageId: item.id })}
                  onReact={(messageId, emoji, parentId) =>
                    react(channel.id, messageId, emoji, parentId)
                  }
                  onCreateIssue={handleCreateIssue}
                />
              ))}
            </div>
          ))}
        </div>

        {typing ? (
          <div
            className="ws-typing"
            style={{ padding: "0 22px 4px", color: "var(--vg-text-4)" }}
            aria-live="polite"
          >
            <i /><i /><i /> {state.members[1].name.split(" ")[0]} is typing…
          </div>
        ) : null}

        <Composer
          onSend={(body) => sendMessage(channel.id, body)}
          placeholder={
            dmPerson ? `Message ${person?.name?.split(" ")[0]}` : `Message #${channel.name}`
          }
        />
      </div>

      {threadMessage ? (
        <aside className="ws-thread" aria-label="Thread">
          <div className="ws-chat-head" style={{ height: 50 }}>
            <Reply size={13} style={{ color: "var(--vg-ember)" }} />
            <div style={{ minWidth: 0 }}>
              <div className="ws-h3" style={{ fontSize: 12 }}>
                Thread
              </div>
              <div style={{ fontSize: 9, color: "var(--vg-text-4)" }}>
                {threadMessage.replies.length} replies in #{channel.name}
              </div>
            </div>
            <span className="ws-spacer" />
            <button
              type="button"
              className="ws-btn ws-btn--icon"
              style={{ width: 26, height: 26 }}
              onClick={() => setThread(null)}
              aria-label="Close thread"
            >
              <X size={12} />
            </button>
          </div>

          <div className="ws-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            <Message
              message={threadMessage}
              channel={channel}
              parentId={threadMessage.id}
              onIssue={openIssue}
              onReply={() => {}}
              onReact={(messageId, emoji, parentId) =>
                react(channel.id, messageId, emoji, parentId)
              }
              onCreateIssue={handleCreateIssue}
            />
            <div
              className="ws-row"
              style={{ gap: 8, margin: "10px 0", fontSize: 9, color: "var(--vg-text-4)" }}
            >
              <span style={{ height: 1, flex: 1, background: "var(--vg-line)" }} />
              {threadMessage.replies.length} replies
              <span style={{ height: 1, flex: 1, background: "var(--vg-line)" }} />
            </div>
            {threadMessage.replies.map((reply) => (
              <Message
                key={reply.id}
                message={reply}
                channel={channel}
                parentId={threadMessage.id}
                onIssue={openIssue}
                onReply={() => {}}
                onReact={(messageId, emoji, parentId) =>
                  react(channel.id, messageId, emoji, parentId)
                }
                onCreateIssue={handleCreateIssue}
              />
            ))}
          </div>

          <div style={{ padding: "0 14px 14px" }}>
            <Composer
              compact
              onSend={(body) => sendMessage(channel.id, body, { parentId: threadMessage.id })}
              placeholder="Reply in thread…"
            />
          </div>
        </aside>
      ) : null}
    </div>
  );
}

export default ChannelsPage;
