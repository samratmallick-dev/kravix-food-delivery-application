import { Router } from "express";
import {
      createRazorpayOrder,
      payWithStripe,
      verifyRazorpayPayment,
      verifyStripe
} from "../controllers/payment.controllers.js";

const router = Router();

router.route("/create").post(createRazorpayOrder);
router.route("/verify").post(verifyRazorpayPayment);
router.route("/stripe/create").post(payWithStripe);
router.route("/stripe/verify").post(verifyStripe);


export default router;