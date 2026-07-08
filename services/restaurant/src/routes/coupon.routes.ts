import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  getCouponAnalytics,
} from "../controllers/coupon.controllers.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route("/")
  .post(isAuthenticated, createCoupon)
  .get(getCoupons);

router.route("/apply").post(isAuthenticated, applyCoupon);
router.route("/analytics/:id").get(isAuthenticated, getCouponAnalytics);

router.route(ROUTES.COUPONS.DETAIL)
  .put(isAuthenticated, updateCoupon)
  .delete(isAuthenticated, deleteCoupon);

export default router;
