import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";

// Read-only profile of another user.
export default function UserProfilePage() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/users/${userId}`)
      .then((data) => setProfile(data.user))
      .catch((err) => setError(err.message));
  }, [userId]);

  async function message() {
    const { conversation } = await api("/conversations", { method: "POST", body: { userIds: [profile.id] } });
    navigate(`/chats/${conversation.id}`);
  }

  if (error) return <p className="errors pad">{error}</p>;
  if (!profile) return <p className="center-note muted">Loading…</p>;

  return (
    <div className="page">
      <div className="card pad profile-card">
        <Avatar user={profile} size={96} showStatus />
        <h1>{profile.displayName}</h1>
        <p className="muted">@{profile.username}</p>
        <p>{profile.bio || <span className="muted">No bio yet.</span>}</p>
        <p className="muted small">
          {profile.isOnline ? "Online now" : `Last seen ${new Date(profile.lastSeenAt).toLocaleString()}`} · Joined{" "}
          {new Date(profile.createdAt).toLocaleDateString()}
        </p>
        {profile.id !== me.id && (
          <button type="button" className="btn" onClick={message}>
            Send a message
          </button>
        )}
      </div>
    </div>
  );
}
