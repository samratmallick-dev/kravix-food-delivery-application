import { Router } from "express";
import { isAuthenticated, checkBlocked } from "../middleware/isAuthenticated.js";
import { upload } from "../middleware/multer.js";
import {
      acceptOrder,
      addRiderProfile,
      fetchCurrentOrder,
      fetchDeliveryHistory,
      fetchEarnings,
      fetchIncomingOrder,
      fetchMyProfile,
      toggleRiderAvailability,
      updateOrderStatus
} from "../controllers/rider.controllers.js";

const router = Router();

router.route("/").post(isAuthenticated, upload, addRiderProfile);
router.route("/me").get(isAuthenticated, fetchMyProfile);
router.route("/me/availability").patch(isAuthenticated, checkBlocked, toggleRiderAvailability);
router.route("/earnings").get(isAuthenticated, fetchEarnings);
router.route("/incoming-order").get(isAuthenticated, fetchIncomingOrder);
router.route("/orders/current").get(isAuthenticated, fetchCurrentOrder);
router.route("/orders/status").patch(isAuthenticated, updateOrderStatus);
router.route("/orders/delivery-history").get(isAuthenticated, fetchDeliveryHistory);
router.route("/orders/:orderId/accept").post(isAuthenticated, checkBlocked, acceptOrder);
router.route("/orders/:orderId/decline").post(isAuthenticated, async (_req, res) => {
      // Decline is handled by socket/expiry; acknowledge gracefully
      res.status(200).json({ success: true, message: "Order declined", error: false });
});

export default router;