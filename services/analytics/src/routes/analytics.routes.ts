import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { getDashboardAnalytics, exportRevenueTrendsCSV } from "../controllers/analytics.controllers.js";

const router = Router();

router.route("/")
      .get(isAuthenticated, getDashboardAnalytics);

router.route("/export")
      .get(isAuthenticated, exportRevenueTrendsCSV);

export default router;
