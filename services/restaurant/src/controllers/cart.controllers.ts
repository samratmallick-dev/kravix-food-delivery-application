import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import mongoose from "mongoose";
import { Cart } from "../model/Cart.js";
import { MenuItem } from "../model/MenuItems.js";

export const addToCart = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            if (!req.user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const userId = req.user._id;

            const { restaurantId, itemId } = req.body;

            if (
                  !mongoose.Types.ObjectId.isValid(restaurantId) ||
                  !mongoose.Types.ObjectId.isValid(itemId)
            ) {
                  return res.status(400).json({
                        message: "Invalid restaurant id and item id",
                        error: true,
                        success: false,
                  });
            }

            const cartFromDifferentRestaurant = await Cart.findOne({
                  userId,
                  restaurantId: { $ne: restaurantId },
            });

            if (cartFromDifferentRestaurant) {
                  return res.status(400).json({
                        message:
                              "Your cart contains items from another restaurant. Please clear your cart before adding items from a new restaurant.",
                        error: true,
                        success: false,
                  });
            }

            const menuItem = await MenuItem.findOne({ _id: itemId, restaurantId });

            if (!menuItem) {
                  return res.status(404).json({
                        message: "Menu item not found or does not belong to this restaurant.",
                        error: true,
                        success: false,
                  });
            }

            if (!menuItem.isAvailable) {
                  return res.status(400).json({
                        message: "This item is currently unavailable.",
                        error: true,
                        success: false,
                  });
            }

            const cartItem = await Cart.findOneAndUpdate(
                  { userId, restaurantId, itemId },
                  {
                        $inc: { quantity: 1 },
                        $setOnInsert: { userId, restaurantId, itemId },
                  },
                  { upsert: true, new: true, setDefaultsOnInsert: true },
            );

            const statusCode = cartItem.quantity === 1 ? 201 : 200;

            return res.status(statusCode).json({
                  message: "Item added to cart.",
                  data: cartItem,
                  error: false,
                  success: true,
            });
      },
);

export const fetchCart = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            if (!req.user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const userId = req.user._id;

            const cart = await Cart.find({ userId })
                  .populate("itemId")
                  .populate("restaurantId");

            let subTotal = 0;
            let cartLength = 0;

            for (const cartItem of cart) {
                  const item = cartItem.itemId as any;
                  subTotal += item.price * cartItem.quantity;
                  cartLength += cartItem.quantity;
            }

            return res.status(200).json({
                  message: "Cart item fetch successfully",
                  success: true,
                  error: false,
                  data: {
                        cart,
                        cartLength,
                        subTotal,
                  },
            });
      },
);

export const incrementCart = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            if (!req.user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const userId = req.user?._id;

            const { itemId } = req.body;

            if (!itemId) {
                  return res.status(400).json({
                        message: "Invalid Request",
                        error: true,
                        success: false,
                  });
            }

            const cartItem = await Cart.findOneAndUpdate(
                  { userId, itemId },
                  {
                        $inc: { quantity: 1 },
                  },
                  { new: true },
            );

            if (!cartItem) {
                  return res.status(404).json({
                        message: "Item not found",
                        error: true,
                        success: false,
                  });
            }

            return res.status(200).json({
                  message: "Cart item quantity increased.",
                  data: cartItem,
                  error: false,
                  success: true,
            });
      },
);

export const decrementCart = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            if (!req.user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const userId = req.user?._id;

            const { itemId } = req.body;

            if (!itemId) {
                  return res.status(400).json({
                        message: "Invalid Request",
                        error: true,
                        success: false,
                  });
            }

            const cartItem = await Cart.findOne({ userId, itemId });

            if (!cartItem) {
                  return res.status(404).json({
                        message: "Item not found",
                        error: true,
                        success: false,
                  });
            }

            if (cartItem.quantity === 1) {
                  await Cart.deleteOne({ userId, itemId });
                  return res.status(200).json({
                        message: "Cart item removed.",
                        data: cartItem,
                        error: false,
                        success: true,
                  });
            }

            cartItem.quantity -= 1;
            await cartItem.save();

            return res.status(200).json({
                  message: "Cart item quantity decreased.",
                  data: cartItem,
                  error: false,
                  success: true,
            });
      },
);

export const clearCart = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            if (!req.user) {
                  return res.status(401).json({
                        message: "User not authenticated",
                        success: false,
                        error: true,
                  });
            }

            const userId = req.user?._id;

            await Cart.deleteMany({ userId });

            return res.status(200).json({
                  message: "Cart Cleared",
                  error: false,
                  success: true,
                  data: {},
            });
      },
);
