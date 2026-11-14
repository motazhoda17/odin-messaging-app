import "dotenv/config";
import cors from "cors";
import express from "express";
import authRouter from "./routes/authRouter.js";
import conversationsRouter from "./routes/conversationsRouter.js";
import usersRouter from "./routes/usersRouter.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Copy .env.example to .env and fill it in.");
}

const app = express();

// Allow the React app (a different origin) to call this API.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/conversations", conversationsRouter);

// Anything else under /api is a 404.
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Express 5 forwards errors from async handlers here automatically.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
