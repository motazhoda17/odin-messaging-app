import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

// Only touch lastSeenAt at most once every 30 seconds per user,
// so we don't write to the database on every single request.
const LAST_SEEN_THROTTLE_MS = 30 * 1000;

// Protects a route: expects "Authorization: Bearer <token>".
// On success the logged-in user is available as req.user.
export async function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "You need to log in first." });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please log in again." });
  }

  let user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
  if (!user) {
    return res.status(401).json({ error: "This account no longer exists." });
  }

  if (Date.now() - user.lastSeenAt.getTime() > LAST_SEEN_THROTTLE_MS) {
    user = await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  }

  req.user = user;
  next();
}
