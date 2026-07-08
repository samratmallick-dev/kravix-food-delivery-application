import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getDashboardAnalytics,
  exportRevenueTrendsCSV
} from "../controllers/analytics.controllers.js";

const router = Router();

router.route("/").get(authenticate, getDashboardAnalytics);
router.route("/export").get(authenticate, exportRevenueTrendsCSV);

export default router;
