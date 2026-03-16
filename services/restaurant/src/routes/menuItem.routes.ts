import { Router } from "express";
import { isAuthenticated, isSeller } from "../middleware/isAuthenticated.js";
import {
      addMenuItems,
      getAllMenuItems,
      deleteMenuItem,
      toggleMenuItemAvailability
} from "../controllers/menuItems.controllers.js";

const router = Router();

router.route("/add-item").post(isAuthenticated, isSeller, addMenuItems);
router.route("/all/:restaurantId").get(isAuthenticated, getAllMenuItems);
router.route("/delete/:itemId").delete(isAuthenticated, isSeller, deleteMenuItem);
router.route("/availability/:itemId").patch(isAuthenticated, isSeller, toggleMenuItemAvailability);


export default router;