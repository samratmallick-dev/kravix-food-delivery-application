import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  riderId: string;
  title: string;
  message: string;
  category: "order" | "promotion" | "payment" | "system" | "warning" | "emergency" | "support" | "document" | "bonus" | "incentive";
  priority: "low" | "medium" | "high" | "critical";
  sound: string;
  actionUrl?: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    riderId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "order",
        "promotion",
        "payment",
        "system",
        "warning",
        "emergency",
        "support",
        "document",
        "bonus",
        "incentive",
      ],
      required: true,
    },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    sound: { type: String, default: "default" },
    actionUrl: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Notification =
  (mongoose.models["Notification"] as mongoose.Model<INotification>) ||
  mongoose.model<INotification>("Notification", notificationSchema);
