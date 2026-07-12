import { z } from "zod";
import { ValidationError } from "../utils/errors.js";

const addressSchema = z.object({
  formattedAddress: z.string().min(3),
  mobile: z.coerce.number().int(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number()
});

const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().optional()
});

const couponSchema = z.object({
  code: z.string().min(2).toUpperCase(),
  discountType: z.enum(["percentage", "flat", "free_delivery"]),
  discountValue: z.coerce.number().nonnegative(),
  maxDiscountAmount: z.coerce.number().default(0),
  minOrderAmount: z.coerce.number().default(0),
  expiryDate: z.string(),
  usageLimit: z.coerce.number().default(0),
  isActive: z.boolean().default(true)
});

const placeOrderSchema = z.object({
  addressId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.coerce.number().int().positive()
    })
  ).nonempty(),
  paymentMethod: z.enum(["razorpay", "stripe", "cod"]),
  couponCode: z.string().optional()
});

const reviewSchema = z.object({
  orderId: z.string(),
  menuItemId: z.string().nullable().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(1)
});

const locationSchema = z.object({
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  country: z.string().trim().min(1, "Country is required"),
  pincode: z.string().trim().min(1, "Pincode is required"),
  landmark: z.string().trim().optional().nullable(),
  latitude: z.coerce.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
  longitude: z.coerce.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
  deliveryRadius: z.coerce.number().int().min(500, "Delivery radius must be at least 500m").max(15000, "Delivery radius cannot exceed 15km").default(5000),
  placeId: z.string().trim().optional().nullable()
});

export class RestaurantValidator {
  static validateLocation(data: any) {
    const result = locationSchema.safeParse(data);
    if (!result.success) {
      const msg = result.error?.issues[0]?.message || "Invalid location data";
      throw new ValidationError(msg);
    }
    return result.data;
  }

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
