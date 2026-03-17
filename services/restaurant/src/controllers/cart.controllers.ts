import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import mongoose from "mongoose";
import { Cart } from "../model/Cart.js";
import { MenuItem } from "../model/MenuItems.js";

export const addToCart = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }

      const userId = req.user._id;

      const { restaurantId, itemId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
                  message: "Invalid restaurant id and item id",
                  error: true,
                  success: false
            });
      }

      const cartFromDifferentRestaurant = await Cart.findOne({
            userId,
            restaurantId: { $ne: restaurantId }
      });

      if (cartFromDifferentRestaurant) {
            return res.status(400).json({
                  message: "Your cart contains items from another restaurant. Please clear your cart before adding items from a new restaurant.",
                  error: true,
                  success: false
            });
      }

      const menuItem = await MenuItem.findOne({ _id: itemId, restaurantId });

      if (!menuItem) {
            return res.status(404).json({
                  message: "Menu item not found or does not belong to this restaurant.",
                  error: true,
                  success: false
            });
      }

      if (!menuItem.isAvailable) {
            return res.status(400).json({
                  message: "This item is currently unavailable.",
                  error: true,
                  success: false
            });
      }

      const existingCartItem = await Cart.findOne({ userId, restaurantId, itemId });

      if (existingCartItem) {
            existingCartItem.quauntity += 1;
            await existingCartItem.save();

            return res.status(200).json({
                  message: "Item quantity updated in cart.",
                  data: existingCartItem,
                  error: false,
                  success: true
            });
      }

      const cartItem = await Cart.create({ userId, restaurantId, itemId });

      return res.status(201).json({
            message: "Item added to cart.",
            data: cartItem,
            error: false,
            success: true
      });
});

export const fetchCart = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user) {
            return res.status(403).json({
                  message: "User not authenticated",
                  success: false,
                  error: true
            });
      }

      const userId = req.user._id;

      const cart = await Cart.find({ userId }).populate("itemId").populate("restaurantId");

      let subTotal = 0;
      let cartLength = 0;

      for (const cartItem of cart) {
            const item = cartItem.itemId as any;
            subTotal += item.price * cartItem.quauntity;
            cartLength += cartLength;
      }

      return res.status(200).json({
            message: "Cart item fetch successfully",
            success: true,
            error: false,
            data: {
                  cart,
                  cartLength,
                  subTotal
            }
      });

});
