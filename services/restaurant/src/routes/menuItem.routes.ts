import { Router } from "express";
import { isAuthenticated, isSeller } from "../middleware/isAuthenticated.js";
import {
      addMenuItems,
      getAllMenuItems,
      deleteMenuItem,
      toggleMenuItemAvailability,
      searchByFood
} from "../controllers/menuItems.controllers.js";
import { upload } from "../middleware/multer.js";

const router = Router();

router.route("/add-item").post(isAuthenticated, isSeller, upload, addMenuItems);
router.route("/all/:restaurantId").get(isAuthenticated, getAllMenuItems);
router.route("/delete/:itemId").delete(isAuthenticated, isSeller, deleteMenuItem);
router.route("/availability/:itemId").patch(isAuthenticated, isSeller, toggleMenuItemAvailability);
router.route("/search/food").get(isAuthenticated, searchByFood);


export default router;