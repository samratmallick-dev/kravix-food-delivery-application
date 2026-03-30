import { Router } from "express";
import { isAuthenticated, isSeller } from "../middleware/isAuthenticated.js";
import {
      addRestaurant,
      fetchMyRestaurant,
      fetchSingleRestaurant,
      getNearestRestaurant,
      updateRestaurant,
      updateRestaurantStatus
} from "../controllers/restaurant.controllers.js";
import { upload } from "../middleware/multer.js";

const router = Router();

router.route("/").post(isAuthenticated, isSeller, upload, addRestaurant);
router.route("/me").get(isAuthenticated, isSeller, fetchMyRestaurant);
router.route("/me/status").patch(isAuthenticated, isSeller, updateRestaurantStatus);
router.route("/me").patch(isAuthenticated, isSeller, updateRestaurant);
router.route("/").get(isAuthenticated, getNearestRestaurant);
router.route("/:id").get(isAuthenticated, fetchSingleRestaurant);

export default router;