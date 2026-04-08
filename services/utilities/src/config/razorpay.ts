import Razorpay from "razorpay";
import "dotenv/config";

export const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY!,
      key_secret: process.env.RAZORPAY_API_KEY_SECRET!,
});