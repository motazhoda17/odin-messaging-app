import { body } from "express-validator";
import { prisma } from "../lib/prisma.js";
import { handleValidation } from "../middleware/validate.js";
import { publicUser } from "../utils/publicUser.js";
import { GUEST_USERNAME } from "./authController.js";

// GET /api/users/me
export function getMe(req, res) {
  res.json({ user: publicUser(req.user) });
}

// PUT /api/users/me - edit your own profile
export const updateMe = [
  body("displayName")
    .trim()
    .isLength({ min: 1, max: 40 })
    .withMessage("Display name must be 1-40 characters."),
  body("bio").optional().trim().isLength({ max: 280 }).withMessage("Bio must be at most 280 characters."),
  body("avatarUrl")
    .optional({ values: "falsy" })
    .trim()
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Avatar must be a full image URL starting with http:// or https://"),
  handleValidation,
  async (req, res) => {
    // The shared guest account can't be renamed, so it stays usable for everyone.
    if (req.user.username === GUEST_USERNAME) {
      return res.status(403).json({ errors: ["The guest profile can't be edited. Sign up to get your own!"] });
    }
    const { displayName, bio = "", avatarUrl = "" } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { displayName, bio, avatarUrl },
    });
    res.json({ user: publicUser(user) });
  },
];

// GET /api/users - everyone except me, online users first
export async function listUsers(req, res) {
  const users = await prisma.user.findMany({
    where: { id: { not: req.user.id } },
    orderBy: [{ lastSeenAt: "desc" }],
  });
  res.json({ users: users.map(publicUser) });
}

// GET /api/users/:id
export async function getUser(req, res) {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
}
