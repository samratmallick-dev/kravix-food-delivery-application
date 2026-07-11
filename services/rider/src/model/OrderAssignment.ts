import mongoose, { Schema, Document } from "mongoose";

export interface ITimelineEvent {
  status: string;
  timestamp: Date;
  description: string;
}

export interface IOrderAssignment extends Document {
  orderId: string;
  riderId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  status: "assigned" | "accepted" | "picked_up" | "delivered" | "cancelled" | "rejected";
  acceptedAt?: Date;
  pickedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  distance?: number;
  deliveryFee?: number;
  tip?: number;
  etaMinutes?: number;
  routePolyline?: string;
  reassignmentCount: number;
  timelineEvents: ITimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const timelineEventSchema = new Schema<ITimelineEvent>({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  description: { type: String, required: true },
});

const orderAssignmentSchema = new Schema<IOrderAssignment>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    riderId: { type: String, required: true, index: true },
    restaurantId: { type: String, required: true },
    restaurantName: { type: String, required: true },
    restaurantAddress: { type: String },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    deliveryAddress: { type: String },
    status: {
      type: String,
      enum: ["assigned", "accepted", "picked_up", "delivered", "cancelled", "rejected"],
      default: "assigned",
    },
    acceptedAt: { type: Date },
    pickedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    distance: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    tip: { type: Number, default: 0 },
    etaMinutes: { type: Number, default: 0 },
    routePolyline: { type: String },
    reassignmentCount: { type: Number, default: 0 },
    timelineEvents: [timelineEventSchema],
  },
  { timestamps: true }
);

export const OrderAssignment =
  (mongoose.models["OrderAssignment"] as mongoose.Model<IOrderAssignment>) ||
  mongoose.model<IOrderAssignment>("OrderAssignment", orderAssignmentSchema);
