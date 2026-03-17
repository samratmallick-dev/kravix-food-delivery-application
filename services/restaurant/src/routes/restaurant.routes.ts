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

router.route("/add-restaurant").post(isAuthenticated, isSeller, upload, addRestaurant);
router.route("/my-restaurant").get(isAuthenticated, isSeller, fetchMyRestaurant);
router.route("/status").put(isAuthenticated, isSeller, updateRestaurantStatus);
router.route("/update").put(isAuthenticated, isSeller, updateRestaurant);
router.route("/all").get(isAuthenticated, getNearestRestaurant);
router.route("/get").get(isAuthenticated, fetchSingleRestaurant);

export default router;