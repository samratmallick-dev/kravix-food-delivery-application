import { Router } from "express";
import { isAdminAuthenticated } from "../middleware/isAdminAuthenticated.js";

import { adminLogin } from "../controllers/admin.controllers.js";
import { getAllUsers, getUserById, blockUser } from "../controllers/user.controllers.js";
import { getAllRestaurants, getRestaurantById, verifyRestaurant, deleteRestaurant } from "../controllers/restaurant.controllers.js";
import { getAllRiders, getRiderById, verifyRider, deleteRider } from "../controllers/rider.controllers.js";
import { getAllOrders, getOrderById, cancelOrder } from "../controllers/order.controllers.js";
import { getDashboard } from "../controllers/dashboard.controllers.js";

const router = Router();

router.post("/login", adminLogin);
router.use(isAdminAuthenticated);
router.get("/dashboard", getDashboard);
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.patch("/users/:userId/block", blockUser);
router.get("/restaurants", getAllRestaurants);
router.get("/restaurants/:restaurantId", getRestaurantById);
router.patch("/restaurants/:restaurantId/verify", verifyRestaurant);
router.delete("/restaurants/:restaurantId", deleteRestaurant);
router.get("/riders", getAllRiders);
router.get("/riders/:riderId", getRiderById);
router.patch("/riders/:riderId/verify", verifyRider);
router.delete("/riders/:riderId", deleteRider);
router.get("/orders", getAllOrders);
router.get("/orders/:orderId", getOrderById);
router.patch("/orders/:orderId/cancel", cancelOrder);

export default router;
