import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
      role: String,
      createdAt: Date
}, { strict: false, collection: "users" });
export const User = mongoose.models.User || mongoose.model("User", userSchema);

const restaurantSchema = new Schema({
      name: String,
      isVerified: Boolean,
      createdAt: Date
}, { strict: false, collection: "restaurants" });
export const Restaurant = mongoose.models.Restaurant || mongoose.model("Restaurant", restaurantSchema);

const orderSchema = new Schema({
      restaurantId: String,
      restaurantName: String,
      riderId: String,
      subtotal: Number,
      deliveryFee: Number,
      platformFee: Number,
      discountAmount: Number,
      totalAmount: Number,
      riderAmount: Number,
      status: String,
      paymentStatus: String,
      items: [{
            itemId: String,
            name: String,
            price: Number,
            quantity: Number
      }],
      createdAt: Date
}, { strict: false, collection: "orders" });
export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

const riderSchema = new Schema({
      userId: String,
      rating: Number,
      ratingCount: Number,
      totalEarnings: Number,
      totalDeliveries: Number
}, { strict: false, collection: "riders" });
export const Rider = mongoose.models.Rider || mongoose.model("Rider", riderSchema);

const reviewSchema = new Schema({
      restaurantId: String,
      riderId: String,
      rating: Number,
      comment: String,
      type: String,
      createdAt: Date
}, { strict: false, collection: "reviews" });
export const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
