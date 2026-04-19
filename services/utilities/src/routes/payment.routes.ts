import { Router } from "express";
import {
      createRazorpayOrder,
      payWithStripe,
      verifyRazorpayPayment,
      verifyStripe
} from "../controllers/payment.controllers.js";

const router = Router();

router.route("/razorpay").post(createRazorpayOrder);
router.route("/razorpay/verify").post(verifyRazorpayPayment);
router.route("/stripe").post(payWithStripe);
router.route("/stripe/verify").post(verifyStripe);


export default router;