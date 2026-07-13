import { StripeClient } from "../clients/stripe.client.js";
import { RazorpayClient } from "../clients/razorpay.client.js";
import { CloudinaryClient } from "../clients/cloudinary.client.js";
import { InMemoryPaymentRepository } from "../repositories/payment.repository.js";
import { PaymentEvents } from "../events/PaymentEvents.js";
import { PaymentService } from "./PaymentService.js";

export const stripeClient = new StripeClient();
export const razorpayClient = new RazorpayClient();
export const cloudinaryClient = new CloudinaryClient();

export const paymentRepository = new InMemoryPaymentRepository();
export const paymentEvents = new PaymentEvents();

export const paymentService = new PaymentService(stripeClient, razorpayClient, paymentRepository, paymentEvents);
