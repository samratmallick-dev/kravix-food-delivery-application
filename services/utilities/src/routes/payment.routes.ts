import { Router } from "express";
import {
  createRazorpayOrder,
  payWithStripe,
  verifyRazorpayPayment,
  verifyStripe
} from "../controllers/payment.controllers.js";
import { idempotency } from "../middleware/idempotency.js";
import { ROUTES } from "../constants/routes.js";

const router = Router();

router.route("/razorpay").post(idempotency, createRazorpayOrder);
router.route("/razorpay/verify").post(verifyRazorpayPayment);
router.route("/stripe").post(idempotency, payWithStripe);
router.route("/stripe/verify").post(verifyStripe);

export default router;
