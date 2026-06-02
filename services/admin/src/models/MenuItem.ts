import mongoose, { Document, Schema } from "mongoose";

export interface IMenuItem extends Document {
      restaurantId: mongoose.Types.ObjectId;
      name: string;
      description: string;
      price: number;
      imageUrl?: string;
      isAvailable: boolean;
      createdAt: Date;
      updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
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
      },
      { timestamps: true },
);

export const MenuItem =
      (mongoose.models["MenuItem"] as mongoose.Model<IMenuItem>) ||
      mongoose.model<IMenuItem>("MenuItem", menuItemSchema);
