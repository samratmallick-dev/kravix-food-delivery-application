import { Router } from "express";
import { isAuthenticated, isSeller } from "../middleware/isAuthenticated.js";
import { addRestaurant, fetchMyRestaurant } from "../controllers/restaurant.controllers.js";
import { upload } from "../middleware/multer.js";

const router = Router();

router.route("/add-restaurant").post(isAuthenticated, isSeller, upload, addRestaurant);
router.route("/my-restaurant").get(isAuthenticated, isSeller, fetchMyRestaurant);

export default router;