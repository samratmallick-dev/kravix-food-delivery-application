import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
      userId: string;
      userName: string;
      userImage?: string;
      orderId: string;
      restaurantId: string;
      menuItemId?: string | null;
      riderId?: string | null;
      rating: number;
      comment: string;
      type: "restaurant" | "menu_item" | "rider";
      isReported: boolean;
      reportReason?: string;
      status: "pending" | "approved" | "flagged";
      createdAt: Date;
      updatedAt: Date;
}

const reviewSchema: Schema = new Schema<IReview>(
      {
            userId: {
                  type: String,
                  required: true,
            },
            userName: {
                  type: String,
                  required: true,
            },
            userImage: {
                  type: String,
                  default: "",
            },
            orderId: {
                  type: String,
                  required: true,
            },
            restaurantId: {
                  type: String,
                  required: true,
            },
            menuItemId: {
                  type: String,
                  default: null,
            },
            riderId: {
                  type: String,
                  default: null,
            },
            rating: {
                  type: Number,
                  required: true,
                  min: 1,
                  max: 5,
            },
            comment: {
                  type: String,
                  required: true,
                  trim: true,
            },
            type: {
                  type: String,
                  required: true,
                  enum: ["restaurant", "menu_item", "rider"],
            },
            isReported: {
                  type: Boolean,
                  default: false,
            },
            reportReason: {
                  type: String,
                  default: "",
            },
            status: {
                  type: String,
                  enum: ["pending", "approved", "flagged"],
                  default: "approved",
            },
      },
      { timestamps: true },
);

reviewSchema.index({ restaurantId: 1, type: 1, status: 1 });
reviewSchema.index({ riderId: 1, type: 1, status: 1 });
reviewSchema.index({ orderId: 1, userId: 1, type: 1 });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
