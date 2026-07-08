import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { searchByFood, autocomplete } from "../controllers/menuItems.controllers.js";
import { getNearestRestaurant } from "../controllers/restaurant.controllers.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.get(ROUTES.SEARCH.MENU_ITEMS, isAuthenticated, searchByFood);
router.get(ROUTES.SEARCH.RESTAURANTS, isAuthenticated, getNearestRestaurant);
router.get(ROUTES.SEARCH.SUGGESTIONS, isAuthenticated, autocomplete);
router.get("/", isAuthenticated, searchByFood);

export default router;
