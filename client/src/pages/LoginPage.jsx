import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ErrorList from "../components/ErrorList.jsx";

export default function LoginPage() {
  const { user, handleAuth } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  // Once logged in (or if already logged in), leave the login page.
  // We go back to the page the user originally wanted, if there was one.
  if (user) return <Navigate to={location.state?.from || "/chats"} replace />;

  async function submit(path, body) {
    setBusy(true);
    setErrors([]);
    try {
      handleAuth(await api(path, { method: "POST", body }));
    } catch (err) {
      setErrors(err.messages || [err.message]);
    } finally {
      setBusy(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  return (
    <div className="auth-page">
      <form
        className="card auth-card"
        onSubmit={(e) => {
          e.preventDefault();
          submit("/auth/login", form);
        }}
      >
        <h1>💬 Chatter</h1>
        <p className="muted">Log in to keep chatting.</p>
        <ErrorList errors={errors} />
        <label>
          Username
          <input name="username" value={form.username} onChange={handleChange} autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="btn" disabled={busy}>
          Log in
        </button>
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => submit("/auth/guest")}>
          Try it as a guest
        </button>
        <p className="muted">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
