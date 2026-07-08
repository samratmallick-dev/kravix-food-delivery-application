import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  addAddress,
  deleteAddress,
  getMyAddress,
} from "../controllers/address.controllers.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route("/")
  .post(isAuthenticated, addAddress)
  .get(isAuthenticated, getMyAddress);

router.route(ROUTES.ADDRESSES.DETAIL).delete(isAuthenticated, deleteAddress);

export default router;
