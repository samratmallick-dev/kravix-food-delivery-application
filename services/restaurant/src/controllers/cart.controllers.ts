import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { cartService } from "../services/index.js";
import { NotFoundError } from "../utils/errors.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const addToCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const { restaurantId, itemId } = req.body;
  const cartItem = await cartService.addToCart(user._id.toString(), itemId, restaurantId, 1);
  const statusCode = cartItem.quantity === 1 ? 201 : 200;
  return successResponse(res, statusCode, "Item added to cart.", cartItem);
});

export const fetchCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const cart = await cartService.getCart(user._id.toString());

  let subTotal = 0;
  let cartLength = 0;

  for (const cartItem of cart) {
    const item = cartItem.itemId as any;
    subTotal += item.price * cartItem.quantity;
    cartLength += cartItem.quantity;
  }

  return successResponse(res, 200, "Cart fetched successfully", { cart, cartLength, subTotal });
});

export const incrementCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const { itemId } = req.body;
  const cart = await cartService.getCart(user._id.toString());
  const item = cart.find((i) => i.itemId._id.toString() === itemId);
  if (!item) {
    throw new NotFoundError("Item not found");
  }

  const updated = await cartService.updateQuantity(user._id.toString(), itemId, item.quantity + 1);
  return successResponse(res, 200, "Cart item quantity increased.", updated);
});

export const decrementCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const { itemId } = req.body;
  const cart = await cartService.getCart(user._id.toString());
  const item = cart.find((i) => i.itemId._id.toString() === itemId);
  if (!item) {
    throw new NotFoundError("Item not found");
  }

  const updated = await cartService.updateQuantity(user._id.toString(), itemId, item.quantity - 1);
  return successResponse(res, 200, "Cart item quantity decreased.", updated);
});

export const clearCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  await cartService.clearCart(user._id.toString());
  return successResponse(res, 200, "Cart cleared successfully");
});
