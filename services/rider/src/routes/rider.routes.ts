import { Router } from "express";
import { isAuthenticated, checkBlocked } from "../middleware/isAuthenticated.js";
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
      updateOrderStatus
} from "../controllers/rider.controllers.js";

const router = Router();

router.route("/").post(isAuthenticated, upload, addRiderProfile);
router.route("/me").get(isAuthenticated, fetchMyProfile);
router.route("/me/availability").patch(isAuthenticated, checkBlocked, toggleRiderAvailability);
router.route("/me/location").patch(isAuthenticated, updateLiveLocation);
router.route("/me/earnings").get(isAuthenticated, fetchEarnings);
router.route("/orders/current").get(isAuthenticated, fetchCurrentOrder);
router.route("/orders/status").patch(isAuthenticated, updateOrderStatus);
router.route("/orders/delivery-history").get(isAuthenticated, fetchDeliveryHistory);
router.route("/orders/:orderId/accept").post(isAuthenticated, checkBlocked, acceptOrder);
router.route("/orders/otp/generate").post(isAuthenticated, generateDeliveryOtp);

export default router;
