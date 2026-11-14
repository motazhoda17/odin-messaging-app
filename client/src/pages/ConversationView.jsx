import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import { conversationTitle, formatTime, otherMember } from "../utils.js";

const POLL_MS = 3000;

// Giving the view a "key" makes React start fresh (empty state) whenever
// you switch to a different conversation.
export default function ConversationRoute() {
  const { conversationId } = useParams();
  return <ConversationView key={conversationId} conversationId={conversationId} />;
}

function ConversationView({ conversationId }) {
  const { user } = useAuth();
  const { refreshConversations } = useOutletContext();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  // A ref (not state) because the polling timer needs the latest value
  // without restarting every time a message arrives.
  const lastIdRef = useRef(0);

  // Load the conversation, then keep checking for new messages.
  useEffect(() => {
    let cancelled = false;

    async function loadNew() {
      try {
        const data = await api(`/conversations/${conversationId}/messages?after=${lastIdRef.current}`);
        if (cancelled || data.messages.length === 0) return;
        lastIdRef.current = data.messages.at(-1).id;
        setMessages((prev) => {
          // Skip anything we already have (e.g. a message we just sent).
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    api(`/conversations/${conversationId}`)
      .then((data) => !cancelled && setConversation(data.conversation))
      .catch((err) => !cancelled && setError(err.message));
    loadNew();
    const timer = setInterval(loadNew, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [conversationId]);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    try {
      const { message } = await api(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: { content },
      });
      lastIdRef.current = Math.max(lastIdRef.current, message.id);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      refreshConversations();
    } catch (err) {
      setError(err.message);
      setDraft(content); // give the text back so it isn't lost
    }
  }

  if (error && !conversation) return <p className="errors pad">{error}</p>;
  if (!conversation) return <p className="center-note muted">Loading…</p>;

  const other = otherMember(conversation, user);

  return (
    <div className="conversation">
      <header className="conversation-header">
        <Link to="/chats" className="back-link" aria-label="Back to chats">
          ←
        </Link>
        {other ? <Avatar user={other} showStatus /> : <span className="avatar group-avatar">👥</span>}
        <div>
          <h2>{other ? <Link to={`/users/${other.id}`}>{other.displayName}</Link> : conversationTitle(conversation, user)}</h2>
          <p className="muted small">
            {other
              ? other.isOnline
                ? "Online"
                : "Offline"
              : conversation.members.map((m) => m.displayName).join(", ")}
          </p>
        </div>
      </header>

      <ol className="messages">
        {messages.length === 0 && <li className="center-note muted">Say hi 👋</li>}
        {messages.map((m) => {
          const mine = m.sender.id === user.id;
          return (
            <li key={m.id} className={`message ${mine ? "mine" : ""}`}>
              {!mine && <Avatar user={m.sender} size={28} />}
              <div className="bubble">
                {/* In group chats, show who sent each message. */}
                {conversation.isGroup && !mine && <span className="sender">{m.sender.displayName}</span>}
                <p>{m.content}</p>
                <time>{formatTime(m.createdAt)}</time>
              </div>
            </li>
          );
        })}
        <li ref={bottomRef} />
      </ol>

      {error && <p className="errors">{error}</p>}
      <form className="composer" onSubmit={handleSend}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          aria-label="Message"
          maxLength={2000}
        />
        <button className="btn" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
