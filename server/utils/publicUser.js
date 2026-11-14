// Turn a database user into something safe to send to the browser.
// We never send the password hash, and we add a computed "isOnline" flag.

// A user counts as online if we heard from them in the last 2 minutes.
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    lastSeenAt: user.lastSeenAt,
    isOnline: Date.now() - new Date(user.lastSeenAt).getTime() < ONLINE_WINDOW_MS,
  };
}
