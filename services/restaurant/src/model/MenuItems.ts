import mongoose, { Schema, Document } from "mongoose";

export interface IMenuItem extends Document {
      restaurantId: mongoose.Types.ObjectId;
      name: string;
      description: string;
      price: number;
      imageUrl?: string;
      isAvailable: boolean;
      isVeg: boolean;
      category: string;
      createdAt: Date;
      updatedAt: Date;
}

const menuItemSchema: Schema = new Schema<IMenuItem>(
      {
            restaurantId: {
                  type: Schema.Types.ObjectId,
                  ref: "Restaurant",
                  required: true,
                  index: true,
            },
            name: {
                  type: String,
                  trim: true,
                  required: true,
            },
            description: {
                  type: String,
                  trim: true,
            },
            price: {
                  type: Number,
                  required: true,
            },
            imageUrl: {
                  type: String,
                  required: false,
            },
            isAvailable: {
                  type: Boolean,
                  required: true,
                  default: true,
            },
            isVeg: {
                  type: Boolean,
                  required: true,
                  default: true,
            },
            category: {
                  type: String,
                  required: true,
                  trim: true,
                  default: "Main Course",
            },
      },
      { timestamps: true },
);

menuItemSchema.index({ name: "text", description: "text" });
menuItemSchema.index({ name: 1 });

export const MenuItem = mongoose.model<IMenuItem>("MenuItem", menuItemSchema);