import mongoose, { Schema, Document } from "mongoose";

export interface ICouponUsage extends Document {
      couponId: mongoose.Types.ObjectId | string;
      userId: string;
      orderId: string;
      discountApplied: number;
      usedAt: Date;
}

const couponUsageSchema: Schema = new Schema<ICouponUsage>(
      {
            couponId: {
                  type: Schema.Types.ObjectId,
                  ref: "Coupon",
                  required: true,
            },
            userId: {
                  type: String,
                  required: true,
            },
            orderId: {
                  type: String,
                  required: true,
            },
            discountApplied: {
                  type: Number,
                  required: true,
                  min: 0,
            },
            usedAt: {
                  type: Date,
                  default: Date.now,
            },
      },
      { timestamps: true },
);

export const CouponUsage = mongoose.model<ICouponUsage>(
      "CouponUsage",
      couponUsageSchema,
);
