import mongoose, { Schema, Document } from "mongoose";

export interface IVehicle extends Document {
  riderId: string;
  type: "bike" | "scooter" | "cycle" | "ev";
  fuelType: "petrol" | "electric" | "none";
  number: string;
  manufacturer: string;
  vehicleModel: string;
  color: string;
  ownership: "owned" | "rented" | "leased";
  insuranceExpiry: Date | null;
  rcExpiry: Date | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    riderId: { type: String, required: true, unique: true },
    type: { type: String, enum: ["bike", "scooter", "cycle", "ev"], required: true },
    fuelType: { type: String, enum: ["petrol", "electric", "none"], required: true },
    number: { type: String, required: true },
    manufacturer: { type: String, required: true },
    vehicleModel: { type: String, required: true },
    color: { type: String, required: true },
    ownership: { type: String, enum: ["owned", "rented", "leased"], required: true },
    insuranceExpiry: { type: Date, default: null },
    rcExpiry: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Vehicle =
  (mongoose.models["Vehicle"] as mongoose.Model<IVehicle>) ||
  mongoose.model<IVehicle>("Vehicle", vehicleSchema);
