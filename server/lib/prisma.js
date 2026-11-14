// One shared Prisma Client for the whole app.
// Prisma 7 talks to PostgreSQL through a "driver adapter" (here: node-postgres).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
