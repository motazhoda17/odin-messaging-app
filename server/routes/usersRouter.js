import { Router } from "express";
import { getMe, getUser, listUsers, updateMe } from "../controllers/usersController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Every route in this file needs a logged-in user.
router.use(requireAuth);

router.get("/", listUsers);
router.get("/me", getMe);
router.put("/me", updateMe);
router.get("/:id", getUser);

export default router;
