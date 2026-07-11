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
  updateRiderProfile,
  startShiftController,
  endShiftController,
  pauseShiftController,
  resumeShiftController,
  getShiftHistoryController,
  getVehicleController,
  updateVehicleController,
  getWalletSummaryController,
  getWalletTransactionsController,
  getWalletSettlementsController,
  withdrawFundsController,
  configureBankDetailsController,
  getDocumentsController,
  uploadDocumentController,
  getNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  getPerformanceStatisticsController,
  getLeaderboardController,
  getAnalyticsController
} from "../controllers/rider.controllers.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route("/").post(authenticate, upload, addRiderProfile);

router.route(ROUTES.RIDERS.ME)
  .get(authenticate, fetchMyProfile)
  .patch(authenticate, checkBlocked, upload, updateRiderProfile);

router.route("/profile")
  .get(authenticate, fetchMyProfile)
  .patch(authenticate, checkBlocked, upload, updateRiderProfile);

router.route("/shift/start").post(authenticate, checkBlocked, startShiftController);
router.route("/shift/end").post(authenticate, checkBlocked, endShiftController);
router.route("/shift/pause").post(authenticate, checkBlocked, pauseShiftController);
router.route("/shift/resume").post(authenticate, checkBlocked, resumeShiftController);
router.route("/shift/history").get(authenticate, getShiftHistoryController);

router.route("/vehicle")
  .get(authenticate, getVehicleController)
  .patch(authenticate, checkBlocked, updateVehicleController);

router.route("/status")
  .get(authenticate, fetchMyProfile)
  .post(authenticate, checkBlocked, (req, res, next) => {
    req.body = { ...req.body, isAvailable: req.body.status === "ONLINE" };
    return toggleRiderAvailability(req, res, next);
  });

router.route("/me/availability")
  .patch(authenticate, checkBlocked, requireRole("rider"), toggleRiderAvailability);

router.route("/location")
  .get(authenticate, async (req, res, next) => {
    return fetchMyProfile(req, res, next);
  })
  .post(authenticate, updateLiveLocation);

router.route("/me/location")
  .patch(authenticate, updateLiveLocation);

router.route(ROUTES.RIDERS.LOCATION)
  .patch(authenticate, updateLiveLocation);

router.route("/wallet")
  .get(authenticate, getWalletSummaryController);
router.route("/wallet/summary")
  .get(authenticate, getWalletSummaryController);
router.route("/wallet/history")
  .get(authenticate, getWalletTransactionsController);
router.route("/wallet/transactions")
  .get(authenticate, getWalletTransactionsController);
router.route("/wallet/settlements")
  .get(authenticate, getWalletSettlementsController);
router.route("/wallet/withdraw")
  .post(authenticate, checkBlocked, withdrawFundsController);
router.route("/wallet/bank")
  .post(authenticate, checkBlocked, configureBankDetailsController)
  .patch(authenticate, checkBlocked, configureBankDetailsController);

router.route("/documents")
  .get(authenticate, getDocumentsController)
  .patch(authenticate, checkBlocked, upload, uploadDocumentController);
router.route("/documents/upload")
  .post(authenticate, checkBlocked, upload, uploadDocumentController);

router.route("/notifications")
  .get(authenticate, getNotificationsController)
  .patch(authenticate, markAllNotificationsReadController);
router.route("/notifications/read")
  .patch(authenticate, markAllNotificationsReadController);
router.route("/notifications/:id/read")
  .patch(authenticate, markNotificationReadController);

router.route("/performance")
  .get(authenticate, getPerformanceStatisticsController);
router.route("/statistics")
  .get(authenticate, getPerformanceStatisticsController);
router.route("/dashboard")
  .get(authenticate, getPerformanceStatisticsController);
router.route("/leaderboard")
  .get(authenticate, getLeaderboardController);

router.route("/analytics")
  .get(authenticate, getAnalyticsController);
router.route("/bonuses")
  .get(authenticate, getAnalyticsController);
router.route("/incentives")
  .get(authenticate, getAnalyticsController);

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

export default router;
