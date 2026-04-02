import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
      addToCart,
      clearCart,
      decrementCart,
      fetchCart,
      incrementCart
} from "../controllers/cart.controllers.js";

const router = Router();

router.route("/").post(isAuthenticated, addToCart);
router.route("/").get(isAuthenticated, fetchCart);
router.route("/increment").patch(isAuthenticated, incrementCart);
router.route("/decrement").patch(isAuthenticated, decrementCart);
router.route("/").delete(isAuthenticated, clearCart);

export default router;