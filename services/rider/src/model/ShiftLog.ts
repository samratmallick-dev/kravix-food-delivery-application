import mongoose, { Schema, Document } from "mongoose";

export interface IBreak extends Document {
  start: Date;
  end?: Date;
  durationSeconds?: number;
}

export interface IShiftLog extends Document {
  riderId: string;
  startTime: Date;
  endTime?: Date;
  breaks: IBreak[];
  durationMinutes?: number;
  status: "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const breakSchema = new Schema<IBreak>({
  start: { type: Date, required: true },
  end: { type: Date },
  durationSeconds: { type: Number },
});

const shiftLogSchema = new Schema<IShiftLog>(
  {
    riderId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    breaks: [breakSchema],
    durationMinutes: { type: Number },
    status: { type: String, enum: ["active", "completed"], default: "active" },
  },
  { timestamps: true }
);

export const ShiftLog =
  (mongoose.models["ShiftLog"] as mongoose.Model<IShiftLog>) ||
  mongoose.model<IShiftLog>("ShiftLog", shiftLogSchema);
