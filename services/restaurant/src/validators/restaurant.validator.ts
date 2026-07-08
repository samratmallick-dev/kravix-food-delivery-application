import { z } from "zod";
import { ValidationError } from "../utils/errors.js";

const addressSchema = z.object({
  formattedAddress: z.string().min(3),
  mobile: z.number().int(),
  latitude: z.number(),
  longitude: z.number()
});

const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().optional()
});

const couponSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  discountType: z.enum(["percentage", "flat", "free_delivery"]),
  discountValue: z.number().nonnegative(),
  maxDiscountAmount: z.number().default(0),
  minOrderAmount: z.number().default(0),
  expiryDate: z.string(),
  usageLimit: z.number().default(0),
  isActive: z.boolean().default(true)
});

const placeOrderSchema = z.object({
  addressId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().int().positive()
    })
  ).nonempty(),
  paymentMethod: z.enum(["razorpay", "stripe", "cod"]),
  couponCode: z.string().optional()
});

const reviewSchema = z.object({
  orderId: z.string(),
  menuItemId: z.string().nullable().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1)
});

export class RestaurantValidator {
  static validateAddress(data: any) {
    const result = addressSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid address data";
      throw new ValidationError(msg);
    }
    return result.data;
  }

  static validateMenuItem(data: any) {
    const result = menuItemSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid menu item data";
      throw new ValidationError(msg);
    }
    return result.data;
  }

  static validateCoupon(data: any) {
    const result = couponSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid coupon data";
      throw new ValidationError(msg);
    }
    return result.data;
  }

  static validatePlaceOrder(data: any) {
    const result = placeOrderSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid order placement payload";
      throw new ValidationError(msg);
    }
    return result.data;
  }

  static validateReview(data: any) {
    const result = reviewSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid review data";
      throw new ValidationError(msg);
    }
    return result.data;
  }
}
