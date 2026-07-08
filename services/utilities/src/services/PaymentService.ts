import axios from "axios";
import { IPaymentService } from "../interfaces/IPaymentService.js";
import { IStripeClient } from "../interfaces/IStripeClient.js";
import { IRazorpayClient } from "../interfaces/IRazorpayClient.js";
import { IPaymentRepository } from "../interfaces/IPaymentRepository.js";
import { PaymentEvents } from "../events/PaymentEvents.js";
import { PaymentFactory } from "../factories/PaymentFactory.js";
import { CreatePaymentDto, StripeSessionResponseDto, RazorpayOrderResponseDto, VerifyPaymentResponseDto } from "../dto/CreatePaymentDto.js";
import { ValidationError, ExternalServiceError, NotFoundError } from "../utils/errors.js";

export class PaymentService implements IPaymentService {
  constructor(
    private readonly stripeClient: IStripeClient,
    private readonly razorpayClient: IRazorpayClient,
    private readonly paymentRepository: IPaymentRepository,
    private readonly eventPublisher: PaymentEvents
  ) {}

  async createRazorpayOrder(dto: CreatePaymentDto): Promise<RazorpayOrderResponseDto> {
    const { orderId } = dto;
    if (!orderId) {
      throw new ValidationError("orderId is required");
    }

    const orderUrl = `${process.env.RESTAURANT_BASE_URL}/api/v1/orders/${orderId}/payment`;
    const { data } = await axios.get(orderUrl, {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY
      }
    });

    const totalAmount = data.data.totalAmount;
    const currency = data.data.currency || "INR";

    const razorpayOrder = await this.razorpayClient.createOrder(
      orderId,
      Math.round(totalAmount * 100),
      currency
    );

    const payment = PaymentFactory.create(orderId, totalAmount, currency, "razorpay");
    payment.complete(razorpayOrder.id);
    await this.paymentRepository.save(payment);

    return {
      razorpayOrderId: razorpayOrder.id,
      key_id: process.env.RAZORPAY_API_KEY || ""
    };
  }

  async verifyRazorpayPayment(body: any): Promise<VerifyPaymentResponseDto> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      throw new ValidationError("razorpay_order_id, razorpay_payment_id, razorpay_signature and orderId are required");
    }

    const isValid = this.razorpayClient.verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      throw new ValidationError("Invalid signature | Payment verification failed");
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (payment) {
      payment.complete(razorpay_payment_id);
      await this.paymentRepository.save(payment);
    }

    await this.eventPublisher.publishPaymentSuccess({
      orderId,
      paymentId: razorpay_payment_id,
      provider: "razorpay"
    });

    return {
      success: true,
      message: "Payment verified successfully"
    };
  }

  async createStripeCheckoutSession(dto: CreatePaymentDto): Promise<StripeSessionResponseDto> {
    const { orderId } = dto;
    if (!orderId) {
      throw new ValidationError("orderId is required");
    }

    const orderUrl = `${process.env.RESTAURANT_BASE_URL}/api/v1/orders/${orderId}/payment`;
    const { data } = await axios.get(orderUrl, {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY
      }
    });

    const totalAmount = data.data.totalAmount;
    const currency = data.data.currency || "INR";

    const successUrl = `${process.env.CLIENT_URL}/ordersuccess?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.CLIENT_URL}/checkout`;

    const session = await this.stripeClient.createCheckoutSession(
      orderId,
      Math.round(totalAmount * 100),
      successUrl,
      cancelUrl
    );

    const payment = PaymentFactory.create(orderId, totalAmount, currency, "stripe");
    payment.complete(session.id);
    await this.paymentRepository.save(payment);

    return {
      sessionId: session.id,
      url: session.url
    };
  }

  async verifyStripePayment(body: any): Promise<VerifyPaymentResponseDto> {
    const { sessionId } = body;
    if (!sessionId) {
      throw new ValidationError("sessionId is required");
    }

    const session = await this.stripeClient.retrieveCheckoutSession(sessionId);
    if (!session || session.payment_status !== "paid") {
      throw new ValidationError("Payment not completed or session not found");
    }

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      throw new ValidationError("Order id not found in session metadata");
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (payment) {
      payment.complete(sessionId);
      await this.paymentRepository.save(payment);
    }

    await this.eventPublisher.publishPaymentSuccess({
      orderId,
      paymentId: sessionId,
      provider: "stripe"
    });

    return {
      success: true,
      message: "Payment verified successfully"
    };
  }
}
