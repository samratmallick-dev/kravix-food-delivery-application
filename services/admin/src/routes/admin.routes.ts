import { Router } from "express";
import { isAdminAuthenticated } from "../middleware/isAdminAuthenticated.js";
import { adminLogin } from "../controllers/admin.controllers.js";
import { getAllUsers, getUserById, blockUser } from "../controllers/user.controllers.js";
import { getAllRestaurants, getRestaurantById, verifyRestaurant, deleteRestaurant, approveLocationUpdate, rejectLocationUpdate } from "../controllers/restaurant.controllers.js";
import { getAllRiders, getRiderById, verifyRider, deleteRider } from "../controllers/rider.controllers.js";
import { getAllOrders, getOrderById, cancelOrder } from "../controllers/order.controllers.js";
import { getDashboard } from "../controllers/dashboard.controllers.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.post(ROUTES.ADMIN.LOGIN, adminLogin);
router.use(isAdminAuthenticated);
router.get(ROUTES.ADMIN.DASHBOARD, getDashboard);
router.get(ROUTES.ADMIN.USERS, getAllUsers);
router.get(ROUTES.ADMIN.USER_DETAIL, getUserById);
router.patch(ROUTES.ADMIN.BLOCK_USER, blockUser);
router.patch(ROUTES.ADMIN.UNBLOCK_USER, blockUser);
router.get(ROUTES.ADMIN.RESTAURANTS, getAllRestaurants);
router.get(ROUTES.ADMIN.RESTAURANT_DETAIL, getRestaurantById);
router.patch(ROUTES.ADMIN.VERIFY_RESTAURANT, verifyRestaurant);
router.patch("/restaurants/:restaurantId/location/approve", approveLocationUpdate);
router.patch("/restaurants/:restaurantId/location/reject", rejectLocationUpdate);
router.delete(ROUTES.ADMIN.DELETE_RESTAURANT, deleteRestaurant);
router.get(ROUTES.ADMIN.RIDERS, getAllRiders);
router.get(ROUTES.ADMIN.RIDER_DETAIL, getRiderById);
router.patch(ROUTES.ADMIN.VERIFY_RIDER, verifyRider);
router.delete(ROUTES.ADMIN.DELETE_RIDER, deleteRider);
router.get(ROUTES.ADMIN.ORDERS, getAllOrders);
router.get(ROUTES.ADMIN.ORDER_DETAIL, getOrderById);
router.patch(ROUTES.ADMIN.CANCEL_ORDER, cancelOrder);

export default router;