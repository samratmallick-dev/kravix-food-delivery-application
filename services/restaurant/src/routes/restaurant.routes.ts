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
  updateRestaurantLocation,
} from "../controllers/restaurant.controllers.js";
import { upload } from "../middleware/multer.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route("/me")
  .get(isAuthenticated, isSeller, fetchMyRestaurant)
  .patch(isAuthenticated, isSeller, checkBlocked, upload, updateRestaurant);

router.route("/me/location")
  .patch(isAuthenticated, isSeller, checkBlocked, updateRestaurantLocation);

router.route("/me/status")
  .patch(isAuthenticated, isSeller, checkBlocked, updateRestaurantStatus);

router.route("/")
  .post(isAuthenticated, isSeller, checkBlocked, upload, addRestaurant)
  .get(isAuthenticated, getNearestRestaurant);

router.route(ROUTES.RESTAURANTS.DETAIL)
  .get(isAuthenticated, fetchSingleRestaurant);

export default router;
