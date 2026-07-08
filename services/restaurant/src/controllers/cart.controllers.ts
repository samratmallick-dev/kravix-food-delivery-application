import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { cartService } from "../services/index.js";
import { NotFoundError } from "../utils/errors.js";

export const addToCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const { restaurantId, itemId } = req.body;
  const cartItem = await cartService.addToCart(user._id.toString(), itemId, restaurantId, 1);

  const statusCode = cartItem.quantity === 1 ? 201 : 200;

  return res.status(statusCode).json({
    message: "Item added to cart.",
    data: cartItem,
    error: false,
    success: true
  });
});

export const fetchCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const cart = await cartService.getCart(user._id.toString());

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
      subTotal
    }
  });
});

export const incrementCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const { itemId } = req.body;
  const cart = await cartService.getCart(user._id.toString());
  const item = cart.find((i) => i.itemId._id.toString() === itemId);
  if (!item) {
    throw new NotFoundError("Item not found");
  }

  const updated = await cartService.updateQuantity(user._id.toString(), itemId, item.quantity + 1);

  return res.status(200).json({
    message: "Cart item quantity increased.",
    data: updated,
    error: false,
    success: true
  });
});

export const decrementCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const { itemId } = req.body;
  const cart = await cartService.getCart(user._id.toString());
  const item = cart.find((i) => i.itemId._id.toString() === itemId);
  if (!item) {
    throw new NotFoundError("Item not found");
  }

  const updated = await cartService.updateQuantity(user._id.toString(), itemId, item.quantity - 1);

  return res.status(200).json({
    message: "Cart item quantity decreased.",
    data: updated,
    error: false,
    success: true
  });
});

export const clearCart = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  await cartService.clearCart(user._id.toString());

  return res.status(200).json({
    message: "Cart Cleared",
    error: false,
    success: true,
    data: {}
  });
});
