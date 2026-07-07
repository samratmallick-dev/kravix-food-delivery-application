import { Router } from "express";
import {
      isAuthenticated,
      isSeller,
      checkBlocked,
} from "../middleware/isAuthenticated.js";
import {
      assignRiderToOrder,
      cancelMyOrder,
      confirmCodPayment,
      createOrder,
      fetchOrderForPayment,
      fetchRestaurantOrders,
      getCurrentOrdersForRiders,
      getDeliveredOrdersByRider,
      getMyOrders,
      getOrderByIdInternal,
      getRestaurantSalesStats,
      getSingleOrder,
      reorderItems,
      setOrderOtp,
      updateOrderStatus,
      updateOrderStatusByRider,
} from "../controllers/order.controllers.js";

const router = Router();

router.route("/").post(isAuthenticated, checkBlocked, createOrder);
router.route("/me").get(isAuthenticated, getMyOrders);
router.route("/me/:orderId").get(isAuthenticated, getSingleOrder);
router
      .route("/me/:orderId/cancel")
      .patch(isAuthenticated, checkBlocked, cancelMyOrder);
router
      .route("/reorder/:orderId")
      .post(isAuthenticated, checkBlocked, reorderItems);

router.route("/internal/rider-assignment").patch(assignRiderToOrder);
router.route("/internal/current").get(getCurrentOrdersForRiders);
router.route("/internal/status").patch(updateOrderStatusByRider);
router.route("/internal/delivery-history").get(getDeliveredOrdersByRider);
router.route("/internal/set-otp").patch(setOrderOtp);
router.route("/internal/cod-payment").patch(confirmCodPayment);
router.route("/internal/:orderId").get(getOrderByIdInternal);

router
      .route("/restaurants/:restaurantId")
      .get(isAuthenticated, isSeller, checkBlocked, fetchRestaurantOrders);
router
      .route("/restaurants/:restaurantId/sales-stats")
      .get(isAuthenticated, isSeller, checkBlocked, getRestaurantSalesStats);

router
      .route("/:orderId/status")
      .patch(isAuthenticated, isSeller, checkBlocked, updateOrderStatus);
router.route("/:id/payment").get(fetchOrderForPayment);

export default router;
