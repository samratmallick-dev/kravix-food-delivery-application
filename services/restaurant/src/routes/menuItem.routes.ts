import { Router } from "express";
import { isAuthenticated, isSeller } from "../middleware/isAuthenticated.js";
import {
  addMenuItems,
  getAllMenuItems,
  deleteMenuItem,
  toggleMenuItemAvailability,
  searchByFood,
  autocomplete,
} from "../controllers/menuItems.controllers.js";
import { upload } from "../middleware/multer.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route("/").post(isAuthenticated, isSeller, upload, addMenuItems);
router.route("/autocomplete").get(isAuthenticated, autocomplete);
router.route("/search").get(isAuthenticated, searchByFood);
router.route("/:restaurantId").get(isAuthenticated, getAllMenuItems);
router.route(ROUTES.MENU_ITEMS.DETAIL).delete(isAuthenticated, isSeller, deleteMenuItem);
router.route("/:itemId/availability").patch(isAuthenticated, isSeller, toggleMenuItemAvailability);

export default router;
