import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { addToCart, fetchCart } from "../controllers/cart.controllers.js";

const router = Router();

router.route("/add").post(isAuthenticated, addToCart);
router.route("/all").get(isAuthenticated, fetchCart);

export default router;