import { Payment } from "../domain/entities/Payment.js";
import { CreatePaymentDto, StripeSessionResponseDto, RazorpayOrderResponseDto, VerifyPaymentResponseDto } from "../dto/CreatePaymentDto.js";

export interface IPaymentService {
  createRazorpayOrder(dto: CreatePaymentDto): Promise<RazorpayOrderResponseDto>;
  verifyRazorpayPayment(body: any): Promise<VerifyPaymentResponseDto>;
  createStripeCheckoutSession(dto: CreatePaymentDto): Promise<StripeSessionResponseDto>;
  verifyStripePayment(body: any): Promise<VerifyPaymentResponseDto>;
}
