export interface CreatePaymentDto {
  orderId: string;
}

export interface RazorpayOrderResponseDto {
  razorpayOrderId: string;
  key_id: string;
}

export interface StripeSessionResponseDto {
  sessionId: string;
  url: string | null;
}

export interface VerifyPaymentResponseDto {
  success: boolean;
  message: string;
}
