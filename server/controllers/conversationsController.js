import { body } from "express-validator";
import { prisma } from "../lib/prisma.js";
import { handleValidation } from "../middleware/validate.js";
import { publicUser } from "../utils/publicUser.js";

// What to load alongside a conversation: its members and newest message.
const conversationInclude = {
  members: { include: { user: true } },
  messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: true } },
};

// Shape a conversation for the front end.
function formatConversation(conversation) {
  const [last] = conversation.messages ?? [];
  return {
    id: conversation.id,
    name: conversation.name,
    isGroup: conversation.isGroup,
    updatedAt: conversation.updatedAt,
    members: conversation.members.map((m) => publicUser(m.user)),
    lastMessage: last ? formatMessage(last) : null,
  };
}

function formatMessage(message) {
  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    conversationId: message.conversationId,
    sender: publicUser(message.sender),
  };
}

// Finds a conversation only if the current user is a member of it.
// Returns null otherwise, so people can't read other users' chats.
async function findMyConversation(conversationId, userId) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, members: { some: { userId } } },
    include: conversationInclude,
  });
}

// GET /api/conversations - my inbox, most recently active first
export async function listConversations(req, res) {
  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId: req.user.id } } },
    include: conversationInclude,
    orderBy: { updatedAt: "desc" },
  });
  res.json({ conversations: conversations.map(formatConversation) });
}

// POST /api/conversations
// { userIds: [5] }                     -> direct message (re-uses an existing one)
// { userIds: [5, 7], name: "Friends" } -> group chat
export const createConversation = [
  body("userIds").isArray({ min: 1, max: 20 }).withMessage("Pick at least one person to message."),
  body("userIds.*").isInt({ min: 1 }).toInt(),
  body("name").optional({ values: "falsy" }).trim().isLength({ max: 50 }).withMessage("Group name is too long."),
  handleValidation,
  async (req, res) => {
    const me = req.user.id;
    // Remove duplicates and myself from the list.
    const otherIds = [...new Set(req.body.userIds)].filter((id) => id !== me);
    if (otherIds.length === 0) {
      return res.status(400).json({ errors: ["You can't start a chat with only yourself."] });
    }

    const found = await prisma.user.count({ where: { id: { in: otherIds } } });
    if (found !== otherIds.length) {
      return res.status(400).json({ errors: ["One or more of those users doesn't exist."] });
    }

    const isGroup = otherIds.length > 1;

    if (!isGroup) {
      // Only ever keep one direct-message thread between two people.
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [{ members: { some: { userId: me } } }, { members: { some: { userId: otherIds[0] } } }],
        },
        include: conversationInclude,
      });
      if (existing) return res.json({ conversation: formatConversation(existing) });
    } else if (!req.body.name) {
      return res.status(400).json({ errors: ["Group chats need a name."] });
    }

    const conversation = await prisma.conversation.create({
      data: {
        isGroup,
        name: isGroup ? req.body.name : null,
        members: { create: [me, ...otherIds].map((userId) => ({ userId })) },
      },
      include: conversationInclude,
    });
    res.status(201).json({ conversation: formatConversation(conversation) });
  },
];

// GET /api/conversations/:id
export async function getConversation(req, res) {
  const conversation = await findMyConversation(Number(req.params.id), req.user.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found." });
  res.json({ conversation: formatConversation(conversation) });
}

// GET /api/conversations/:id/messages?after=<messageId>
// "after" lets the client poll for only the new messages.
export async function listMessages(req, res) {
  const conversationId = Number(req.params.id);
  const conversation = await findMyConversation(conversationId, req.user.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found." });

  const after = Number(req.query.after) || 0;
  const messages = await prisma.message.findMany({
    where: { conversationId, id: { gt: after } },
    orderBy: { id: "asc" },
    include: { sender: true },
  });
  res.json({ messages: messages.map(formatMessage) });
}

// POST /api/conversations/:id/messages  { content }
export const sendMessage = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Messages must be between 1 and 2000 characters."),
  handleValidation,
  async (req, res) => {
    const conversationId = Number(req.params.id);
    const conversation = await findMyConversation(conversationId, req.user.id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found." });

    // A transaction makes both writes succeed or fail together.
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { content: req.body.content, conversationId, senderId: req.user.id },
        include: { sender: true },
      }),
      // Touch the conversation so it jumps to the top of everyone's inbox.
      prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    ]);
    res.status(201).json({ message: formatMessage(message) });
  },
];
