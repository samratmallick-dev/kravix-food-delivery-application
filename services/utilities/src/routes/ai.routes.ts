import express from "express";
import { aiChat, aiFeedback } from "../controllers/ai.controllers.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.post("/chat", authenticate, aiChat);
router.post("/feedback", authenticate, aiFeedback);

export default router;
