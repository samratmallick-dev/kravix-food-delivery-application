import { Request, Response } from "express";
import { paymentService } from "../services/index.js";
import { createPaymentSchema, verifyRazorpayPaymentSchema, verifyStripePaymentSchema } from "../validators/PaymentValidator.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { successResponse } from "../utils/response.js";

export const createRazorpayOrder = TryCatch(async (req: Request, res: Response) => {
  const validated = createPaymentSchema.parse(req.body);
  const data = await paymentService.createRazorpayOrder(validated);
  return successResponse(res, 200, "Razorpay order created successfully", data);
});

export const verifyRazorpayPayment = TryCatch(async (req: Request, res: Response) => {
  const validated = verifyRazorpayPaymentSchema.parse(req.body);
  const data = await paymentService.verifyRazorpayPayment(validated);
  return successResponse(res, 200, data.message);
});

export const payWithStripe = TryCatch(async (req: Request, res: Response) => {
  const validated = createPaymentSchema.parse(req.body);
  const data = await paymentService.createStripeCheckoutSession(validated);
  return successResponse(res, 200, "Stripe payment initiated successfully", data);
});

export const verifyStripe = TryCatch(async (req: Request, res: Response) => {
  const validated = verifyStripePaymentSchema.parse(req.body);
  const data = await paymentService.verifyStripePayment(validated);
  return successResponse(res, 200, data.message);
});
