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
  getRiderLocation,
  toggleRiderAvailability,
  updateLiveLocation,
  updateOrderStatus,
  updateRiderProfile
} from "../controllers/rider.controllers.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route("/").post(authenticate, upload, addRiderProfile);

router.route(ROUTES.RIDERS.ME)
  .get(authenticate, fetchMyProfile)
  .patch(authenticate, checkBlocked, upload, updateRiderProfile);

router.route("/me/availability")
  .patch(authenticate, checkBlocked, requireRole("rider"), toggleRiderAvailability);

router.route("/me/location")
  .patch(authenticate, updateLiveLocation);

router.route(ROUTES.RIDERS.LOCATION)
  .patch(authenticate, updateLiveLocation);

router.route("/me/earnings")
  .get(authenticate, fetchEarnings);

router.route("/orders/current")
  .get(authenticate, fetchCurrentOrder);

router.route("/orders/:orderId/status")
  .patch(authenticate, updateOrderStatus);

router.route("/orders/delivery-history")
  .get(authenticate, fetchDeliveryHistory);

router.route(ROUTES.RIDERS.ACCEPT)
  .post(authenticate, checkBlocked, acceptOrder);

router.route(ROUTES.RIDERS.PICKUP)
  .patch(authenticate, checkBlocked, (req, res, next) => {
    req.body = { ...req.body, status: "picked_up", orderId: req.params["orderId"] };
    return updateOrderStatus(req, res, next);
  });

router.route(ROUTES.RIDERS.DELIVER)
  .patch(authenticate, checkBlocked, (req, res, next) => {
    req.body = { ...req.body, status: "delivered", orderId: req.params["orderId"] };
    return updateOrderStatus(req, res, next);
  });

router.route("/orders/:orderId/otp/generate")
  .post(authenticate, generateDeliveryOtp);

router.route("/:riderId/location")
  .get(getRiderLocation);

export default router;
