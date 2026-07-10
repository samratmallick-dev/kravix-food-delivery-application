import mongoose, { Schema, Document } from "mongoose";
import { getUniqueSlug } from "../utils/slugify.js";

export interface IRestaurant extends Document {
      name: string;
      slug: string;
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
            slug: {
                  type: String,
                  required: true,
                  unique: true,
                  lowercase: true,
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
restaurantSchema.index({ slug: 1 }, { unique: true });
restaurantSchema.index({ ownerId: 1 });
restaurantSchema.index({ isVerified: 1 });
restaurantSchema.index({ isOpen: 1 });

restaurantSchema.pre("validate", async function () {
      const doc = this as any;
      if (!doc.slug || doc.isModified("name")) {
            doc.slug = await getUniqueSlug(doc.name, doc._id.toString());
      }
});

export const Restaurant = mongoose.model<IRestaurant>(
      "Restaurant",
      restaurantSchema,
);