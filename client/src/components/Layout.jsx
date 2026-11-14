import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Avatar from "./Avatar.jsx";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="logo">💬 Chatter</span>
        <nav>
          <NavLink to="/chats">Chats</NavLink>
          <NavLink to="/people">People</NavLink>
          <NavLink to="/profile" className="nav-profile" aria-label="Your profile">
            <Avatar user={user} size={28} />
            <span>{user.displayName}</span>
          </NavLink>
        </nav>
        <button type="button" className="btn-link" onClick={logout}>
          Log out
        </button>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
