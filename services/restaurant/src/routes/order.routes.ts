import { Router } from "express";
import { isAuthenticated, isSeller } from "../middleware/isAuthenticated.js";
import {
      createOrder,
      fetchOrderForPayment,
      fetchRestaurantOrders,
      getMyOrders,
      getSingleOrder,
      updateOrderStatus
} from "../controllers/order.controllers.js";

const router = Router();

router.route("/create").post(isAuthenticated, createOrder);
router.route("/fetch-payment/:id").get(fetchOrderForPayment);
router.route("/:restaurantId").get(isAuthenticated, isSeller, fetchRestaurantOrders);
router.route("/update-status/:orderId").put(isAuthenticated, isSeller, updateOrderStatus);

router.route("/my-orders").get(isAuthenticated, getMyOrders);
router.route("/my-orders/:orderId").get(isAuthenticated, getSingleOrder);

export default router;