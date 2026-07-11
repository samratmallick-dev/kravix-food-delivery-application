import mongoose, { Schema, Document } from "mongoose";

export interface IRider extends Document {
      userId: string;
      picture: string;
      phoneNumber: string;
      aadhaarNumber: string;
      drivingLicesce: string;
      isVerified: boolean;

      location: {
            type: "Point";
            coordinates: [number, number];
      };

      isAvailable: boolean;
      availabilityStatus: "ONLINE" | "OFFLINE" | "BUSY" | "BREAK" | "DELIVERING" | "RETURNING" | "UNAVAILABLE" | "SUSPENDED";
      lastActiveAt: Date;

      totalEarnings: number;
      totalDeliveries: number;
      rating: number;
      ratingCount: number;

      deliveryOtp?: string | null;
      deliveryOtpExpiry?: Date | null;

      emergencyContact?: {
            name: string;
            phone: string;
            relation: string;
      } | null;
      address?: string | null;

      createdAt: Date;
      updatedAt: Date;
}

const riderSchema: Schema = new Schema<IRider>(
      {
            userId: {
                  type: String,
                  unique: true,
                  required: true,
            },
            picture: {
                  type: String,
                  required: false,
            },
            phoneNumber: {
                  type: String,
                  required: true,
            },
            aadhaarNumber: {
                  type: String,
                  required: true,
            },
            drivingLicesce: {
                  type: String,
                  required: true,
            },
            isVerified: {
                  type: Boolean,
                  required: true,
                  default: false,
            },

            location: {
                  type: {
                        type: String,
                        required: true,
                        enum: ["Point"],
                        default: "Point",
                  },
                  coordinates: {
                        type: [Number],
                        require: true,
                  },
            },

            isAvailable: {
                  type: Boolean,
                  required: true,
                  default: false,
            },
            availabilityStatus: {
                  type: String,
                  enum: ["ONLINE", "OFFLINE", "BUSY", "BREAK", "DELIVERING", "RETURNING", "UNAVAILABLE", "SUSPENDED"],
                  required: true,
                  default: "OFFLINE",
            },
            lastActiveAt: {
                  type: Date,
                  required: true,
                  default: Date.now,
            },
            totalEarnings: {
                  type: Number,
                  default: 0,
            },
            totalDeliveries: {
                  type: Number,
                  default: 0,
            },
            rating: {
                  type: Number,
                  default: 0,
            },
            ratingCount: {
                  type: Number,
                  default: 0,
            },
            deliveryOtp: {
                  type: String,
                  default: null,
            },
            deliveryOtpExpiry: {
                  type: Date,
                  default: null,
            },
            emergencyContact: {
                  name: { type: String, default: "" },
                  phone: { type: String, default: "" },
                  relation: { type: String, default: "" },
            },
            address: {
                  type: String,
                  default: "",
            },
      },
      { timestamps: true },
);

riderSchema.index({ location: "2dsphere" });

export const Rider = mongoose.model<IRider>("Rider", riderSchema);