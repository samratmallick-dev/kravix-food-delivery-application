import { Router } from "express";
import { isAuthenticated, isSeller } from "../middleware/isAuthenticated.js";
import { addRestaurant, fetchMyRestaurant } from "../controllers/restaurant.controllers.js";

const router = Router();

router.route("/add-restaurant").post(isAuthenticated, isSeller, addRestaurant);
router.route("/my-restaurant").get(isAuthenticated, isSeller, fetchMyRestaurant);

export default router;