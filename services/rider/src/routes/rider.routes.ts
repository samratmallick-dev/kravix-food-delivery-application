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

router.route("/").post(isAuthenticated, upload, addRiderProfile);
router.route("/me").get(isAuthenticated, fetchMyProfile);
router.route("/me/availability").patch(isAuthenticated, toggleRiderAvailability);
router.route("/orders/current").get(isAuthenticated, fetchCurrentOrder);
router.route("/orders/status").patch(isAuthenticated, updateOrderStatus);
router.route("/orders/delivery-history").get(isAuthenticated, fetchDeliveryHistory);
router.route("/orders/:orderId/accept").post(isAuthenticated, acceptOrder);

export default router;