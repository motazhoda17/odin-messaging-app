import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import Avatar from "../components/Avatar.jsx";
import ErrorList from "../components/ErrorList.jsx";

// Lists every other user. From here you can start a direct message,
// or tick several people and create a group chat.
export default function PeoplePage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(null);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    api("/users")
      .then((data) => setUsers(data.users))
      .catch((err) => setErrors([err.message]));
  }, []);

  async function startConversation(userIds, name) {
    try {
      const { conversation } = await api("/conversations", { method: "POST", body: { userIds, name } });
      navigate(`/chats/${conversation.id}`);
    } catch (err) {
      setErrors(err.messages || [err.message]);
    }
  }

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const onlineCount = users?.filter((u) => u.isOnline).length ?? 0;

  return (
    <div className="page">
      <div className="card pad">
        <h1>People</h1>
        <p className="muted">
          {users ? `${users.length} people · ${onlineCount} online now` : "Loading…"}
        </p>
        <ErrorList errors={errors} />

        <ul className="people">
          {users?.map((u) => (
            <li key={u.id} className="person">
              <input
                type="checkbox"
                aria-label={`Select ${u.displayName} for a group chat`}
                checked={selected.includes(u.id)}
                onChange={() => toggle(u.id)}
              />
              <Avatar user={u} showStatus />
              <Link to={`/users/${u.id}`} className="person-name">
                <strong>{u.displayName}</strong>
                <span className="muted small">@{u.username}</span>
              </Link>
              <button type="button" className="btn btn-small" onClick={() => startConversation([u.id])}>
                Message
              </button>
            </li>
          ))}
        </ul>

        {selected.length >= 2 && (
          <form
            className="group-form"
            onSubmit={(e) => {
              e.preventDefault();
              startConversation(selected, groupName);
            }}
          >
            <span>{selected.length} people selected</span>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              aria-label="Group name"
              required
            />
            <button className="btn">Create group chat</button>
          </form>
        )}
        {selected.length < 2 && <p className="muted small">Tip: tick two or more people to create a group chat.</p>}
      </div>
    </div>
  );
}
