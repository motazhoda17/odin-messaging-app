// Fills the database with a few demo users and conversations.
// Run with: npm run seed   (WARNING: deletes all existing data first)
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

const DEMO_PASSWORD = "password123";

const demoUsers = [
  { username: "guest", displayName: "Guest User", bio: "Just looking around!" },
  { username: "ada", displayName: "Ada Lovelace", bio: "First programmer. Big fan of engines." },
  { username: "linus", displayName: "Linus T.", bio: "Talk is cheap. Show me the code." },
  { username: "grace", displayName: "Grace Hopper", bio: "It's easier to ask forgiveness than permission." },
];

async function main() {
  // Delete children before parents because of the foreign keys.
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = {};
  for (const u of demoUsers) {
    users[u.username] = await prisma.user.create({ data: { ...u, passwordHash } });
  }

  // Helper: create a conversation with members and a list of [sender, text] messages.
  async function chat({ name = null, members, messages }) {
    const conversation = await prisma.conversation.create({
      data: {
        name,
        isGroup: members.length > 2,
        members: { create: members.map((m) => ({ userId: users[m].id })) },
      },
    });
    for (const [sender, content] of messages) {
      await prisma.message.create({
        data: { content, conversationId: conversation.id, senderId: users[sender].id },
      });
    }
  }

  await chat({
    members: ["guest", "ada"],
    messages: [
      ["ada", "Hi there! Welcome to the messaging app 👋"],
      ["ada", "Try replying - your message shows up for me right away."],
    ],
  });
  await chat({
    members: ["guest", "linus"],
    messages: [["linus", "Did you remember to commit your work?"]],
  });
  await chat({
    name: "Study Group",
    members: ["guest", "ada", "linus", "grace"],
    messages: [
      ["grace", "Welcome to the study group chat!"],
      ["ada", "Has everyone finished the Prisma lesson?"],
      ["linus", "Almost. Migrations are clicking now."],
    ],
  });

  console.log(`Seeded ${demoUsers.length} users. Demo password for all of them: ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
