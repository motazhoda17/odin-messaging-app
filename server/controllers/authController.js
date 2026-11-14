import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { body } from "express-validator";
import { prisma } from "../lib/prisma.js";
import { handleValidation } from "../middleware/validate.js";
import { publicUser } from "../utils/publicUser.js";
import { signToken } from "../utils/token.js";

export const GUEST_USERNAME = "guest";

// Send back the same shape for signup, login and guest login.
function authResponse(res, user, status = 200) {
  return res.status(status).json({ token: signToken(user), user: publicUser(user) });
}

const signupRules = [
  body("username")
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9_]{3,20}$/)
    .withMessage("Username must be 3-20 characters: letters, numbers or underscores.")
    .custom(async (username) => {
      const taken = await prisma.user.findUnique({ where: { username } });
      if (taken) throw new Error("That username is already taken.");
    }),
  body("displayName")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 40 })
    .withMessage("Display name must be at most 40 characters."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match."),
];

export const signup = [
  ...signupRules,
  handleValidation,
  async (req, res) => {
    const { username, password, displayName } = req.body;
    // Never store plain passwords - only a salted bcrypt hash.
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash, displayName: displayName || username },
    });
    authResponse(res, user, 201);
  },
];

export const login = [
  body("username").trim().toLowerCase().notEmpty().withMessage("Username is required."),
  body("password").notEmpty().withMessage("Password is required."),
  handleValidation,
  async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    // Same message for "no such user" and "wrong password" so attackers
    // can't find out which usernames exist.
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      return res.status(401).json({ errors: ["Incorrect username or password."] });
    }
    authResponse(res, user);
  },
];

// Lets recruiters try the app without making an account.
// Everyone who clicks "Try as guest" shares the same guest user.
export async function guestLogin(req, res) {
  let user = await prisma.user.findUnique({ where: { username: GUEST_USERNAME } });
  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString("hex");
    user = await prisma.user.create({
      data: {
        username: GUEST_USERNAME,
        displayName: "Guest User",
        bio: "Just looking around!",
        passwordHash: await bcrypt.hash(randomPassword, 10),
      },
    });
  }
  authResponse(res, user);
}
