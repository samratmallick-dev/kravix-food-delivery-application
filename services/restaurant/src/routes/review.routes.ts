import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  createReview,
  getRestaurantReviews,
  getRiderReviews,
  reportReview,
  getAdminReviews,
  moderateReview,
} from "../controllers/review.controllers.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route("/").post(isAuthenticated, createReview);
router.route("/restaurant/:id").get(getRestaurantReviews);
router.route("/rider/:id").get(getRiderReviews);
router.route("/report").post(isAuthenticated, reportReview);
router.route("/admin").get(isAuthenticated, getAdminReviews);
router.route("/admin/moderate/:id").put(isAuthenticated, moderateReview);

export default router;
