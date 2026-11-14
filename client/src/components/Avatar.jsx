import { useState } from "react";

// Shows the user's picture, or their initials if they have none
// (or if the image link is broken).
export default function Avatar({ user, size = 40, showStatus = false }) {
  const [broken, setBroken] = useState(false);
  const initials = (user?.displayName || user?.username || "?")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {user?.avatarUrl && !broken ? (
        <img src={user.avatarUrl} alt="" onError={() => setBroken(true)} />
      ) : (
        initials
      )}
      {showStatus && (
        <span className={`status-dot ${user?.isOnline ? "online" : ""}`} title={user?.isOnline ? "Online" : "Offline"} />
      )}
    </span>
  );
}
