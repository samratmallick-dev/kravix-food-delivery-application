import { request } from "./request";
import { paymentBaseUrl } from "../components/common/constant";
import type { ApiResponse } from "../types/api.types";

export interface CreateRazorpayOrderResponse {
      razorpayOrderId: string;
      key_id: string;
}

export interface VerifyRazorpayPayload {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      orderId: string;
}

export interface PayWithStripeResponse {
      sessionId: string;
      url: string;
}

export const createRazorpayOrder = (orderId: string): Promise<ApiResponse<CreateRazorpayOrderResponse>> =>
      request<ApiResponse<CreateRazorpayOrderResponse>>(`${paymentBaseUrl}/razorpay`, {
            method: "POST",
            body: JSON.stringify({ orderId }),
      });

export const verifyRazorpayPayment = (payload: VerifyRazorpayPayload): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${paymentBaseUrl}/razorpay/verify`, {
            method: "POST",
            body: JSON.stringify(payload),
      });

export const payWithStripe = (orderId: string): Promise<ApiResponse<PayWithStripeResponse>> =>
      request<ApiResponse<PayWithStripeResponse>>(`${paymentBaseUrl}/stripe`, {
            method: "POST",
            body: JSON.stringify({ orderId }),
      });

export const verifyStripePayment = (sessionId: string): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${paymentBaseUrl}/stripe/verify`, {
            method: "POST",
            body: JSON.stringify({ sessionId }),
      });
