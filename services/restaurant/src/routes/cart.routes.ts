import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  addToCart,
  clearCart,
  decrementCart,
  fetchCart,
  incrementCart,
} from "../controllers/cart.controllers.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route("/")
  .post(isAuthenticated, addToCart)
  .get(isAuthenticated, fetchCart)
  .delete(isAuthenticated, clearCart);

router.route("/increment").patch(isAuthenticated, incrementCart);
router.route("/decrement").patch(isAuthenticated, decrementCart);

export default router;
