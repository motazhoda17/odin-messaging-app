import { Router } from "express";
import { guestLogin, login, signup } from "../controllers/authController.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/guest", guestLogin);

export default router;
