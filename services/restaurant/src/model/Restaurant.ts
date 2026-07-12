import mongoose, { Schema, Document } from "mongoose";
import { getUniqueSlug } from "../utils/slugify.js";

export interface ILocation {
      address: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
      landmark?: string;
      latitude: number;
      longitude: number;
      placeId?: string;
      deliveryRadius: number;
      createdAt?: Date;
      updatedAt?: Date;
}

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
      location?: ILocation;
      pendingLocation?: ILocation;
      locationReviewStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
      locationReviewedBy?: string;
      locationReviewedAt?: Date;
      locationReviewReason?: string;
      locationRejectionReason?: string;
      locationUpdatedAt?: Date;
      locationUpdatedBy?: string;
      locationVersion?: number;
      createdAt: Date;
      updatedAt: Date;
}

const locationSubSchema = new Schema(
      {
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            pincode: { type: String, required: true },
            landmark: String,
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true },
            placeId: String,
            deliveryRadius: { type: Number, default: 5000 },
      },
      { timestamps: true }
);

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
            location: {
                  type: locationSubSchema,
                  default: null,
            },
            pendingLocation: {
                  type: locationSubSchema,
                  default: null,
            },
            locationReviewStatus: {
                  type: String,
                  enum: ["PENDING", "APPROVED", "REJECTED", null],
                  default: null,
            },
            locationReviewedBy: { type: String, default: null },
            locationReviewedAt: { type: Date, default: null },
            locationReviewReason: { type: String, default: null },
            locationRejectionReason: { type: String, default: null },
            locationUpdatedAt: { type: Date, default: null },
            locationUpdatedBy: { type: String, default: null },
            locationVersion: { type: Number, default: 0 },
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