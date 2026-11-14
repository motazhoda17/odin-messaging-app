import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ErrorList from "../components/ErrorList.jsx";

const emptyForm = { username: "", displayName: "", password: "", confirmPassword: "" };

export default function SignupPage() {
  const { user, handleAuth } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  // As soon as the account exists, send new users to find people to chat with.
  if (user) return <Navigate to="/people" replace />;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Quick check in the browser; the server checks everything again.
    if (form.password !== form.confirmPassword) {
      setErrors(["Passwords do not match."]);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      handleAuth(await api("/auth/signup", { method: "POST", body: form }));
    } catch (err) {
      setErrors(err.messages || [err.message]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <ErrorList errors={errors} />
        <label>
          Username
          <input name="username" value={form.username} onChange={handleChange} autoComplete="username" required />
        </label>
        <label>
          Display name <span className="muted">(optional)</span>
          <input name="displayName" value={form.displayName} onChange={handleChange} />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength={6}
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirm password
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </label>
        <button className="btn" disabled={busy}>
          Sign up
        </button>
        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
