import mongoose, { Schema, Document } from "mongoose";

export interface IRestaurantLocationHistory extends Document {
  restaurantId: string;
  sellerId: string;
  action: "PROPOSED" | "APPROVED" | "REJECTED" | "IMMEDIATE_UPDATE";
  oldLocation?: {
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
  };
  newLocation: {
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
  };
  ipAddress?: string;
  userAgent?: string;
  triggeredBy: string; // userId of proposer or adminId of reviewer
  reason?: string;
  timestamp: Date;
}

const restaurantLocationHistorySchema = new Schema<IRestaurantLocationHistory>(
  {
    restaurantId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: ["PROPOSED", "APPROVED", "REJECTED", "IMMEDIATE_UPDATE"],
      required: true
    },
    oldLocation: {
      address: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
      landmark: String,
      latitude: Number,
      longitude: Number,
      placeId: String,
      deliveryRadius: Number
    },
    newLocation: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: String,
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      placeId: String,
      deliveryRadius: { type: Number, required: true }
    },
    ipAddress: String,
    userAgent: String,
    triggeredBy: { type: String, required: true },
    reason: String,
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const RestaurantLocationHistory = mongoose.model<IRestaurantLocationHistory>(
  "RestaurantLocationHistory",
  restaurantLocationHistorySchema
);
