import express from "express";
import { aiChat, aiFeedback } from "../controllers/ai.controllers.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

router.post("/chat", isAuthenticated, aiChat);
router.post("/feedback", isAuthenticated, aiFeedback);

export default router;
