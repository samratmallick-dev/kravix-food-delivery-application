import axios from "axios";
import Stripe from "stripe";
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
                        message: "orderId is required",
                  });
            }

            if (!process.env.RESTAURANT_BASE_URL) {
                  throw new Error(
                        "RESTAURANT_BASE_URL is not defined in environment variables",
                  );
            }

            const orderUrl = `${process.env.RESTAURANT_BASE_URL}/api/v1/orders/${orderId}/payment`;

            const { data } = await axios.get(orderUrl, {
                  headers: {
                        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                  },
            });

            const razorpayOrder = await razorpay.orders.create({
                  amount: Math.round(data.data.totalAmount * 100),
                  currency: data.data.currency,
                  receipt: orderId,
            });

            return res.status(200).json({
                  success: true,
                  error: false,
                  message: "Razorpay order created successfully",
                  data: {
                        razorpayOrderId: razorpayOrder.id,
                        key_id: process.env.RAZORPAY_API_KEY,
                  },
            });
      } catch (error) {
            if (axios.isAxiosError(error)) {
                  const status = error.response?.status ?? 502;
                  const msg = error.response?.data?.message || error.message;
                  return res.status(status).json({
                        success: false,
                        error: true,
                        message: msg,
                  });
            }
            const errorMessage =
                  error instanceof Error ? error.message : "Internal server error";
            return res.status(500).json({
                  success: false,
                  error: true,
                  message: errorMessage,
            });
      }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
      try {
            const {
                  razorpay_order_id,
                  razorpay_payment_id,
                  razorpay_signature,
                  orderId,
            } = req.body;

            if (
                  !razorpay_order_id ||
                  !razorpay_payment_id ||
                  !razorpay_signature ||
                  !orderId
            ) {
                  return res.status(400).json({
                        success: false,
                        error: true,
                        message:
                              "razorpay_order_id, razorpay_payment_id, razorpay_signature and orderId are required",
                  });
            }

            const isValidSignature = verifyRazorpaySignature(
                  razorpay_order_id,
                  razorpay_payment_id,
                  razorpay_signature,
            );

            if (!isValidSignature) {
                  return res.status(400).json({
                        success: false,
                        error: true,
                        message: "Invalid signature | Payment verification failed",
                  });
            }

            await publishPaymentSuccess({
                  orderId,
                  paymentId: razorpay_payment_id,
                  provider: "razorpay",
            });

            return res.status(200).json({
                  success: true,
                  error: false,
                  message: "Payment verified successfully",
            });
      } catch (error) {
            const errorMessage =
                  error instanceof Error ? error.message : "Internal server error";
            return res.status(500).json({
                  success: false,
                  error: true,
                  message: errorMessage,
            });
      }
};

const stript = new Stripe(process.env.STRIPE_SECRET_KEY! as string);

export const payWithStripe = async (req: Request, res: Response) => {
      try {
            const { orderId } = req.body;

            if (!orderId) {
                  return res.status(400).json({
                        success: false,
                        error: true,
                        message: "orderId is required",
                  });
            }

            if (!process.env.RESTAURANT_BASE_URL) {
                  throw new Error(
                        "RESTAURANT_BASE_URL is not defined in environment variables",
                  );
            }

            const orderUrl = `${process.env.RESTAURANT_BASE_URL}/api/v1/orders/${orderId}/payment`;

            const { data } = await axios.get(orderUrl, {
                  headers: {
                        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
                  },
            });

            const session = await stript.checkout.sessions.create({
                  payment_method_types: ["card"],
                  mode: "payment",
                  line_items: [
                        {
                              price_data: {
                                    currency: "inr",
                                    product_data: {
                                          name: "Kravix - Online Food order",
                                    },
                                    unit_amount: Math.round(data.data.totalAmount * 100),
                              },
                              quantity: 1,
                        },
                  ],
                  metadata: {
                        orderId,
                  },
                  success_url: `${process.env.CLIENT_URL}/ordersuccess?session_id={CHECKOUT_SESSION_ID}`,
                  cancel_url: `${process.env.CLIENT_URL}/checkout`,
            });

            return res.status(200).json({
                  success: true,
                  error: false,
                  message: "Stripe payment initiated successfully",
                  data: {
                        sessionId: session.id,
                        url: session.url,
                  },
            });
      } catch (error) {
            if (axios.isAxiosError(error)) {
                  const status = error.response?.status ?? 502;
                  const msg = error.response?.data?.message || error.message;
                  return res.status(status).json({
                        success: false,
                        error: true,
                        message: msg,
                  });
            }
            const errorMessage =
                  error instanceof Error ? error.message : "Internal server error";
            return res.status(500).json({
                  success: false,
                  error: true,
                  message: errorMessage,
            });
      }
};

export const verifyStripe = async (req: Request, res: Response) => {
      try {
            const { sessionId } = req.body;

            if (!sessionId) {
                  return res.status(400).json({
                        success: false,
                        error: true,
                        message: "sessionId is required",
                  });
            }

            const session = await stript.checkout.sessions.retrieve(sessionId);

            if (!session || session.payment_status !== "paid") {
                  return res.status(400).json({
                        success: false,
                        error: true,
                        message: "Payment not completed or session not found",
                  });
            }

            const sessionOrderId = session.metadata?.orderId;

            if (!sessionOrderId) {
                  return res.status(400).json({
                        success: false,
                        error: true,
                        message: "Order id not found in session metadata",
                  });
            }

            await publishPaymentSuccess({
                  orderId: sessionOrderId,
                  paymentId: sessionId,
                  provider: "stripe",
            });

            return res.status(200).json({
                  success: true,
                  error: false,
                  message: "Payment verified successfully",
            });
      } catch (error) {
            console.error("Stripe verify error:", error);
            const errorMessage =
                  error instanceof Error ? error.message : "Internal server error";
            return res.status(500).json({
                  success: false,
                  error: true,
                  message: errorMessage,
            });
      }
};