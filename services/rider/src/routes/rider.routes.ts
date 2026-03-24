import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { upload } from "../middleware/multer.js";
import {
      acceptOrder,
      addRiderProfile,
      fetchCurrentOrder,
      fetchDeliveryHistory,
      fetchMyProfile,
      toggleRiderAvailability,
      updateOrderStatus
} from "../controllers/rider.controllers.js";

const router = Router();

router.route("/add-profile").post(isAuthenticated, upload, addRiderProfile);
router.route("/fetch-profile").get(isAuthenticated, fetchMyProfile);
router.route("/toggle-profile").patch(isAuthenticated, toggleRiderAvailability);
router.route("/accept/:orderId").post(isAuthenticated, acceptOrder);
router.route("/order/current").get(isAuthenticated, fetchCurrentOrder);
router.route("/order/update-status").patch(isAuthenticated, updateOrderStatus);
router.route("/order/delivery-history").get(isAuthenticated, fetchDeliveryHistory);

export default router; 