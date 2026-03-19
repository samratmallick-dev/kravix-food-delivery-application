import { Router } from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/payment.controllers.js";

const router = Router();

router.route("/create").post(createRazorpayOrder);
router.route("/verify").post(verifyRazorpayPayment);

export default router;