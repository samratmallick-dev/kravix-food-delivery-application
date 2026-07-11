import mongoose, { Schema, Document } from "mongoose";

export interface ISettlement extends Document {
  riderId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  destinationType: "bank" | "upi";
  destinationDetails: string;
  gatewayReference?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    riderId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    destinationType: { type: String, enum: ["bank", "upi"], required: true },
    destinationDetails: { type: String, required: true },
    gatewayReference: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const Settlement =
  (mongoose.models["Settlement"] as mongoose.Model<ISettlement>) ||
  mongoose.model<ISettlement>("Settlement", settlementSchema);
