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

router.route("/add").post(isAuthenticated, addToCart);
router.route("/all").get(isAuthenticated, fetchCart);
router.route("/inc").patch(isAuthenticated, incrementCart);
router.route("/dec").patch(isAuthenticated, decrementCart);
router.route("/clear").delete(isAuthenticated, clearCart);

export default router;