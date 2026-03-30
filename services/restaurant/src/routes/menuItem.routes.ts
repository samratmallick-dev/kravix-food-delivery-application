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

router.route("/").post(isAuthenticated, isSeller, upload, addMenuItems);
router.route("/search").get(isAuthenticated, searchByFood);
router.route("/:restaurantId").get(isAuthenticated, getAllMenuItems);
router.route("/:itemId").delete(isAuthenticated, isSeller, deleteMenuItem);
router.route("/:itemId/availability").patch(isAuthenticated, isSeller, toggleMenuItemAvailability);


export default router;