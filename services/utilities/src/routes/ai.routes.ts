import express from "express";
import { aiChat, aiFeedback } from "../controllers/ai.controllers.js";
import { authenticate } from "../middleware/authenticate.js";
import { ROUTES } from "../constants/routes.js";

const router = express.Router();

router.post(ROUTES.AI.CHAT, authenticate, aiChat);
router.post("/feedback", authenticate, aiFeedback);
router.get(ROUTES.AI.SEARCH, authenticate, (req, res) => {
  const q = (req.query["q"] as string | undefined) || "";
  res.status(200).json({
    success: true,
    message: "AI search results",
    data: { query: q, results: [] },
    error: false
  });
});
router.get(ROUTES.AI.HEALTH, (_req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

export default router;
