import axios from "axios";
import { Request, Response } from "express";
import { razorpay } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyRazorpay.js";
import { publishPaymentSuccess } from "../config/paymentProducer.js";

export const createRazorpayOrder = async (req: Request, res: Response) => {
      try {
            const { orderId } = req.body;
            const { data } = await axios.get(`${process.env.RESTAURANT_BASE_URL}/api/v1/order/fetch-payment/${orderId}`, {
                  headers: {
                        "x-internal-key": process.env.INTERNAL_SERVICE_KEY
                  }
            });
            const razorpayOrder = await razorpay.orders.create({
                  amount: data.data.totalAmount,
                  currency: data.data.currency,
                  receipt: orderId
            });

            return res.status(200).json({
                  success: true,
                  error: false,
                  message: "Razorpay order created successfully",
                  data: {
                        razorpayOrderId: razorpayOrder.id,
                        key_secret: process.env.RAZORPAY_API_SECRET
                  }
            });
      } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Internal server error"
            return res.status(500).json({
                  success: false,
                  error: true,
                  message: errorMessage
            });
      }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
      try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

            const isValidSignature = verifyRazorpaySignature(
                  razorpay_order_id, 
                  razorpay_payment_id, 
                  razorpay_signature
            );

            if(!isValidSignature) {
                  return res.status(400).json({
                        success: false,
                        error: true,
                        message: "Invalid signature | Payment verification failed"
                  });
            }

            await publishPaymentSuccess({
                  orderId: razorpay_order_id,
                  paymentId: razorpay_payment_id,
                  provider: "razorpay"
            });

            return res.status(200).json({
                  success: true,
                  error: false,
                  message: "Payment verified successfully"
            });

      } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Internal server error"
            return res.status(500).json({
                  success: false,
                  error: true,
                  message: errorMessage
            });
      }
};