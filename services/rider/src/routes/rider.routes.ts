import { Router } from "express";
import { authenticate, checkBlocked } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { upload } from "../middleware/multer.js";
import {
  acceptOrder,
  addRiderProfile,
  fetchCurrentOrder,
  fetchDeliveryHistory,
  fetchEarnings,
  fetchMyProfile,
  generateDeliveryOtp,
  toggleRiderAvailability,
  updateLiveLocation,
  updateOrderStatus,
  updateRiderProfile
} from "../controllers/rider.controllers.js";

const router = Router();

router.route("/")
  .post(authenticate, upload, addRiderProfile);

router.route("/me")
  .get(authenticate, fetchMyProfile)
  .patch(authenticate, checkBlocked, upload, updateRiderProfile);

router.route("/me/availability")
  .patch(authenticate, checkBlocked, requireRole("rider"), toggleRiderAvailability);

router.route("/me/location")
  .patch(authenticate, updateLiveLocation);

router.route("/me/earnings")
  .get(authenticate, fetchEarnings);

router.route("/orders/current")
  .get(authenticate, fetchCurrentOrder);

router.route("/orders/status")
  .patch(authenticate, updateOrderStatus);

router.route("/orders/delivery-history")
  .get(authenticate, fetchDeliveryHistory);

router.route("/orders/:orderId/accept")
  .post(authenticate, checkBlocked, acceptOrder);

router.route("/orders/otp/generate")
  .post(authenticate, generateDeliveryOtp);

export default router;