import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import ErrorList from "../components/ErrorList.jsx";

// Edit your own profile. The preview updates as you type.
export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  });
  const [errors, setErrors] = useState([]);
  const [saved, setSaved] = useState(false);

  function handleChange(e) {
    setSaved(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    try {
      const data = await api("/users/me", { method: "PUT", body: form });
      setUser(data.user); // updates the name/avatar in the top bar too
      setSaved(true);
    } catch (err) {
      setErrors(err.messages || [err.message]);
    }
  }

  return (
    <div className="page">
      <form className="card pad profile-form" onSubmit={handleSubmit}>
        <h1>Your profile</h1>
        <div className="profile-preview">
          <Avatar user={{ ...user, ...form }} size={72} />
          <div>
            <strong>{form.displayName || user.username}</strong>
            <p className="muted small">@{user.username}</p>
          </div>
        </div>
        <ErrorList errors={errors} />
        {saved && <p className="success">Profile saved!</p>}
        <label>
          Display name
          <input name="displayName" value={form.displayName} onChange={handleChange} maxLength={40} required />
        </label>
        <label>
          Bio
          <textarea name="bio" value={form.bio} onChange={handleChange} maxLength={280} rows={3} />
        </label>
        <label>
          Avatar image URL
          <input
            name="avatarUrl"
            type="url"
            value={form.avatarUrl}
            onChange={handleChange}
            placeholder="https://example.com/me.jpg"
          />
        </label>
        <button className="btn">Save changes</button>
      </form>
    </div>
  );
}
