import axios from "axios";
import { Request, Response } from "express";
import { razorpay } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyRazorpay.js";
import { publishPaymentSuccess } from "../config/paymentProducer.js";

export const createRazorpayOrder = async (req: Request, res: Response) => {
      try {
            const { orderId } = req.body;

            if (!orderId) {
                  return res.status(400).json({
                        success: false,
                        error: true,
                        message: "orderId is required"
                  });
            }

            if (!process.env.RESTAURANT_BASE_URL) {
                  throw new Error("RESTAURANT_BASE_URL is not defined in environment variables");
            }

            const orderUrl = `${process.env.RESTAURANT_BASE_URL}/api/v1/order/fetch-payment/${orderId}`;

            const { data } = await axios.get(orderUrl, {
                  headers: {
                        "x-internal-key": process.env.INTERNAL_SERVICE_KEY
                  }
            });

            const razorpayOrder = await razorpay.orders.create({
                  amount: Math.round(data.data.totalAmount * 100),
                  currency: data.data.currency,
                  receipt: orderId
            });

            return res.status(200).json({
                  success: true,
                  error: false,
                  message: "Razorpay order created successfully",
                  data: {
                        razorpayOrderId: razorpayOrder.id,
                        key_id: process.env.RAZORPAY_API_KEY
                  }
            });
      } catch (error) {
            if (axios.isAxiosError(error)) {
                  const status = error.response?.status;
                  const msg = error.response?.data?.message || error.message;
                  return res.status(500).json({
                        success: false,
                        error: true,
                        message: `Internal service call failed (HTTP ${status}): ${msg}`
                  });
            }
            const errorMessage = error instanceof Error ? error.message : "Internal server error";
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

            if (!isValidSignature) {
                  return res.status(400).json({
                        success: false,
                        error: true,
                        message: "Invalid signature | Payment verification failed"
                  });
            }

            await publishPaymentSuccess({
                  orderId,
                  paymentId: razorpay_payment_id,
                  provider: "razorpay"
            });

            return res.status(200).json({
                  success: true,
                  error: false,
                  message: "Payment verified successfully"
            });

      } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Internal server error";
            return res.status(500).json({
                  success: false,
                  error: true,
                  message: errorMessage
            });
      }
};