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
      },

      isAvailable: boolean;
      lastActiveAt: Date;
      createdAt: Date;
      updatedAt: Date;
};

const riderSchema: Schema = new Schema<IRider>({
      userId: {
            type: String,
            unique: true,
            required: true
      },
      picture: {
            type: String,
            required: false
      },
      phoneNumber: {
            type: String,
            required: true
      },
      aadhaarNumber: {
            type: String,
            required: true
      },
      drivingLicesce: {
            type: String,
            required: true
      },
      isVerified: {
            type: Boolean,
            required: true,
            default: false
      },

      location: {
            type: {
                  type: String,
                  required: true,
                  enum: ["Point"],
                  default: "Point"
            },
            coordinates: {
                  type: [Number],
                  require: true
            }
      },

      isAvailable: {
            type: Boolean,
            required: true,
            default: false
      },
      lastActiveAt: {
            type: Date,
            required: true,
            default: Date.now()
      }
}, { timestamps: true });

riderSchema.index({ location: "2dsphere" });

export const Rider = mongoose.model<IRider>("Rider", riderSchema);