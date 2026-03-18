import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { createOrder, fetchOrderForPayment } from "../controllers/order.controllers.js";

const router = Router();

router.route("/create").post(isAuthenticated, createOrder);
router.route("/fetch-payment").get(fetchOrderForPayment);

export default router;