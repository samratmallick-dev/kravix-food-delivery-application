import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
      code: string;
      discountType: "percentage" | "flat" | "free_delivery";
      discountValue: number;
      maxDiscountAmount: number;
      minOrderAmount: number;
      expiryDate: Date;
      usageLimit: number;
      perUserLimit: number;
      usedCount: number;
      isActive: boolean;
      restaurantId: string | null;
      couponType: "global" | "restaurant";
      createdAt: Date;
      updatedAt: Date;
}

const couponSchema: Schema = new Schema<ICoupon>(
      {
            code: {
                  type: String,
                  required: true,
                  unique: true,
                  uppercase: true,
                  trim: true,
            },
            discountType: {
                  type: String,
                  required: true,
                  enum: ["percentage", "flat", "free_delivery"],
            },
            discountValue: {
                  type: Number,
                  required: true,
                  min: 0,
            },
            maxDiscountAmount: {
                  type: Number,
                  default: 0,
            },
            minOrderAmount: {
                  type: Number,
                  default: 0,
            },
            expiryDate: {
                  type: Date,
                  required: true,
            },
            usageLimit: {
                  type: Number,
                  default: 0, // 0 means unlimited
            },
            perUserLimit: {
                  type: Number,
                  default: 1, // 1 usage per user by default
            },
            usedCount: {
                  type: Number,
                  default: 0,
            },
            isActive: {
                  type: Boolean,
                  default: true,
            },
            restaurantId: {
                  type: String,
                  default: null,
            },
            couponType: {
                  type: String,
                  required: true,
                  enum: ["global", "restaurant"],
                  default: "global",
            },
      },
      { timestamps: true },
);

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
