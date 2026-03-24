import { Router } from "express";
import { isAuthenticated, isSeller } from "../middleware/isAuthenticated.js";
import {
      assignRiderToOrder,
      createOrder,
      fetchOrderForPayment,
      fetchRestaurantOrders,
      getCurrentOrdersForRiders,
      getDeliveredOrdersByRider,
      getMyOrders,
      getOrderByIdInternal,
      getSingleOrder,
      updateOrderStatus,
      updateOrderStatusByRider
} from "../controllers/order.controllers.js";

const router = Router();

router.route("/create").post(isAuthenticated, createOrder);
router.route("/fetch-payment/:id").get(fetchOrderForPayment);
router.route("/my-orders").get(isAuthenticated, getMyOrders);
router.route("/my-orders/:orderId").get(isAuthenticated, getSingleOrder);
router.route("/update-status/:orderId").put(isAuthenticated, isSeller, updateOrderStatus);
router.route("/rider/assign").put(assignRiderToOrder);
router.route("/rider/current-order").get(getCurrentOrdersForRiders);
router.route("/rider/update-status").put(updateOrderStatusByRider);
router.route("/internal/order/:orderId").get(getOrderByIdInternal);
router.route("/rider/delivery-history").get(getDeliveredOrdersByRider);

router.route("/:restaurantId").get(isAuthenticated, isSeller, fetchRestaurantOrders);


export default router;