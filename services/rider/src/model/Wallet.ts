import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  riderId: string;
  balance: number;
  pendingSettlement: number;
  codCollection: number;
  tipsEarned: number;
  referralEarnings: number;
  bonuses: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  upiId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    riderId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    pendingSettlement: { type: Number, default: 0 },
    codCollection: { type: Number, default: 0 },
    tipsEarned: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 },
    bonuses: { type: Number, default: 0 },
    bankName: { type: String },
    bankAccountNumber: { type: String },
    bankIfsc: { type: String },
    upiId: { type: String },
  },
  { timestamps: true }
);

export const Wallet =
  (mongoose.models["Wallet"] as mongoose.Model<IWallet>) ||
  mongoose.model<IWallet>("Wallet", walletSchema);
