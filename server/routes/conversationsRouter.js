import { Router } from "express";
import {
  createConversation,
  getConversation,
  listConversations,
  listMessages,
  sendMessage,
} from "../controllers/conversationsController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", listConversations);
router.post("/", createConversation);
router.get("/:id", getConversation);
router.get("/:id/messages", listMessages);
router.post("/:id/messages", sendMessage);

export default router;
