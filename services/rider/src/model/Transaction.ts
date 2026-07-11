import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  riderId: string;
  amount: number;
  type: "credit" | "debit";
  category: "earning" | "bonus" | "penalty" | "referral" | "withdrawal" | "adjustment";
  status: "pending" | "completed" | "failed";
  description: string;
  referenceId?: string;
  gatewayReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    riderId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    category: {
      type: String,
      enum: ["earning", "bonus", "penalty", "referral", "withdrawal", "adjustment"],
      required: true,
    },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
    description: { type: String, required: true },
    referenceId: { type: String },
    gatewayReference: { type: String },
  },
  { timestamps: true }
);

export const Transaction =
  (mongoose.models["Transaction"] as mongoose.Model<ITransaction>) ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);
