import mongoose, { Schema, Document } from "mongoose";

export interface IRestaurant extends Document {
      name: string;
      description: string;
      image: string;
      ownerId: string;
      phone: number;
      isVerified: boolean;

      autoLocation: {
            type: "Point";
            coordinates: [number, number];
            formattedAddress: string;
      };
      isOpen: boolean;
      createdAt: Date;
}

const restaurantSchema: Schema = new Schema<IRestaurant>(
      {
            name: {
                  type: String,
                  required: true,
                  trim: true,
            },
            description: {
                  type: String,
            },
            image: {
                  type: String,
                  required: true,
            },
            ownerId: {
                  type: String,
                  required: true,
            },
            phone: {
                  type: Number,
                  required: true,
            },
            isVerified: {
                  type: Boolean,
                  required: true,
                  default: false,
            },
            autoLocation: {
                  type: {
                        type: String,
                        enum: ["Point"],
                        required: true,
                  },
                  coordinates: {
                        type: [Number],
                        required: true,
                  },
                  formattedAddress: String,
            },
            isOpen: {
                  type: Boolean,
                  default: false,
            },
      },
      { timestamps: true },
);

restaurantSchema.index({ autoLocation: "2dsphere" });
restaurantSchema.index({ name: "text", description: "text" });
restaurantSchema.index({ name: 1 });
restaurantSchema.index({ ownerId: 1 });
restaurantSchema.index({ isVerified: 1 });
restaurantSchema.index({ isOpen: 1 });

export const Restaurant = mongoose.model<IRestaurant>(
      "Restaurant",
      restaurantSchema,
);