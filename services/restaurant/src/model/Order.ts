import mongoose, { Document, Schema } from "mongoose";

export interface IOrder extends Document {
      userId: string;
      restaurantId: string;
      restaurantName: string;
      riderId?: string | null;
      riderPhoneNumber: number | null;
      riderName: string | null;
      distance: number;
      riderAmount: number;

      items: {
            itemId: string;
            name: string;
            price: number;
            quantity: number;
      }[];

      subtotal: number;
      deliveryFee: number;
      platformFee: number;
      totalAmount: number;

      addressId: string;
      deliveryAddress: {
            formatedAddress: string;
            mobile: number;
            customerName: string;
            latitude: number;
            longitude: number;
      };

      status: | "placed" | "accepted" | "preparing" | "ready_for_rider" | "rider_assigned" | "picked_up" | "out_for_delivery" | "reached_delivery_location" | "delivered" | "cancelled";

      paymentMethod: "razorpay" | "stripe";

      paymentStatus: "pending" | "paid" | "failed";

      expiresAt: Date;

      createdAt: Date;
      updatedAt: Date;
};

const orderSchema: Schema = new Schema<IOrder>({
      userId: {
            type: String,
            required: true
      },
      restaurantId: {
            type: String,
            required: true
      },
      restaurantName: {
            type: String,
            required: true
      },
      riderId: {
            type: String,
            default: null
      },
      riderPhoneNumber: {
            type: Number,
            default: null
      },
      riderName: {
            type: String,
            default: null
      },
      distance: {
            type: Number,
            required: true
      },
      riderAmount: {
            type: Number,
            required: true
      },
      items: [
            {
                  itemId: {
                        type: String,
                        required: true
                  },
                  name: {
                        type: String,
                        required: true
                  },
                  price: {
                        type: Number,
                        required: true
                  },
                  quantity: {
                        type: Number,
                        required: true
                  }
            }
      ],
      subtotal: Number,
      deliveryFee: Number,
      platformFee: Number,
      totalAmount: Number,
      addressId: {
            type: String,
            required: true
      },
      deliveryAddress: {
            formatedAddress: {
                  type: String,
                  required: true
            },
            mobile: {
                  type: Number,
                  required: true
            },
            customerName: {
                  type: String,
                  required: true
            },
            latitude: {
                  type: Number,
                  required: true
            },
            longitude: {
                  type: Number,
                  required: true
            }
      },
      status: {
            type: String,
            enum: [
                  "placed",
                  "accepted",
                  "preparing",
                  "ready_for_rider",
                  "rider_assigned",
                  "picked_up",
                  "out_for_delivery",
                  "reached_delivery_location",
                  "delivered",
                  "cancelled"
            ],
            default: "placed"
      },
      paymentMethod: {
            type: String,
            enum: ["razorpay", "stripe"],
            required: true
      },
      paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending"
      },
      expiresAt: {
            type: Date,
            index: {
                  expireAfterSeconds: 0
            }
      }
}, { timestamps: true });

export const Order = mongoose.model<IOrder>("Order", orderSchema);