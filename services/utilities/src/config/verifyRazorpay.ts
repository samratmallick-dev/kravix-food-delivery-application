import crypto from "crypto";

export const verifyRazorpaySignature = (
      orderId: string,
      paymentId: string,
      signature: string
) => {
      const body = `${orderId}|${paymentId}`;
      const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_API_KEY_SECRET!)
            .update(body)
            .digest("hex");
      return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, "hex"),
            Buffer.from(signature, "hex")
      );
};