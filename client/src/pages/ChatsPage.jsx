import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import { conversationTitle, formatTime, otherMember } from "../utils.js";

// How often to re-check the inbox. A REST API can't push updates to us,
// so we "poll" (ask again) on a timer instead.
const POLL_MS = 5000;

export default function ChatsPage() {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState(null);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      const data = await api("/conversations");
      setConversations(data.conversations);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, POLL_MS);
    // Stop polling when we leave the page.
    return () => clearInterval(timer);
  }, [loadConversations]);

  return (
    // The "has-open" class lets CSS show only one panel on small screens.
    <div className={`chats ${conversationId ? "has-open" : ""}`}>
      <aside className="chat-list card">
        <div className="chat-list-header">
          <h2>Chats</h2>
          <Link to="/people" className="btn btn-small">
            + New
          </Link>
        </div>
        {error && <p className="errors">{error}</p>}
        {conversations === null && <p className="muted pad">Loading…</p>}
        {conversations?.length === 0 && (
          <p className="muted pad">
            No conversations yet. <Link to="/people">Find someone to message.</Link>
          </p>
        )}
        <ul>
          {conversations?.map((c) => {
            const other = otherMember(c, user);
            return (
              <li key={c.id}>
                <NavLink to={`/chats/${c.id}`} className="chat-list-item">
                  {other ? (
                    <Avatar user={other} showStatus />
                  ) : (
                    <span className="avatar group-avatar">👥</span>
                  )}
                  <span className="chat-list-text">
                    <strong>{conversationTitle(c, user)}</strong>
                    <span className="muted ellipsis">
                      {c.lastMessage
                        ? `${c.lastMessage.sender.id === user.id ? "You: " : ""}${c.lastMessage.content}`
                        : "No messages yet"}
                    </span>
                  </span>
                  {c.lastMessage && <time className="muted small">{formatTime(c.lastMessage.createdAt)}</time>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="chat-panel card">
        {/* The selected conversation renders here (see App.jsx). */}
        <Outlet context={{ refreshConversations: loadConversations }} />
        {!conversationId && <p className="center-note muted">Select a chat to start messaging.</p>}
      </section>
    </div>
  );
}
