import { Router } from "express";
import {
      isAuthenticated,
      isSeller,
      checkBlocked,
} from "../middleware/isAuthenticated.js";
import {
      addRestaurant,
      fetchMyRestaurant,
      fetchSingleRestaurant,
      getNearestRestaurant,
      updateRestaurant,
      updateRestaurantStatus,
} from "../controllers/restaurant.controllers.js";
import { upload } from "../middleware/multer.js";

const router = Router();

router.route("/me").get(isAuthenticated, isSeller, fetchMyRestaurant);
router
      .route("/me")
      .patch(isAuthenticated, isSeller, checkBlocked, upload, updateRestaurant);
router
      .route("/me/status")
      .patch(isAuthenticated, isSeller, checkBlocked, updateRestaurantStatus);
router
      .route("/")
      .post(isAuthenticated, isSeller, checkBlocked, upload, addRestaurant);
router.route("/").get(isAuthenticated, getNearestRestaurant);
router.route("/:id").get(isAuthenticated, fetchSingleRestaurant);

export default router;
