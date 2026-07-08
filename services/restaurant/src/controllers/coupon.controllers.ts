import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { couponService } from "../services/index.js";
import { RestaurantValidator } from "../validators/restaurant.validator.js";
import { AuthorizationError } from "../utils/errors.js";

export const createCoupon = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  if (user.role !== "admin" && user.role !== "seller") {
    throw new AuthorizationError("Access denied");
  }

  const validData = RestaurantValidator.validateCoupon(req.body);
  const couponType = (req.body.couponType as string) || "global";
  const bodyRestaurantId = (req.body.restaurantId as string) || null;

  const targetRestaurantId = user.role === "seller" ? (user.restaurantId || null) : (couponType === "restaurant" ? bodyRestaurantId : null);

  const coupon = await couponService.createCoupon(targetRestaurantId, validData, couponType);

  return res.status(201).json({
    message: "Coupon created successfully",
    data: coupon,
    success: true,
    error: false
  });
});

export const getCoupons = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  const { restaurantId } = req.query;

  const userRole = user ? user.role : "customer";
  const sellerRestaurantId = user ? (user.restaurantId || null) : null;
  const queryRestaurantId = restaurantId ? (restaurantId as string) : null;

  const coupons = await couponService.getCoupons(userRole, sellerRestaurantId, queryRestaurantId);

  return res.status(200).json({
    message: "Coupons fetched successfully",
    data: coupons,
    success: true,
    error: false
  });
});

export const updateCoupon = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    throw new AuthorizationError("Access denied");
  }

  const id = req.params["id"] as string;
  const sellerRestaurantId = user.restaurantId || null;

  const updated = await couponService.updateCoupon(id, sellerRestaurantId, user.role, req.body);

  return res.status(200).json({
    message: "Coupon updated successfully",
    data: updated,
    success: true,
    error: false
  });
});

export const deleteCoupon = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    throw new AuthorizationError("Access denied");
  }

  const id = req.params["id"] as string;
  const sellerRestaurantId = user.restaurantId || null;

  await couponService.deleteCoupon(id, sellerRestaurantId, user.role);

  return res.status(200).json({
    message: "Coupon deleted successfully",
    success: true,
    error: false
  });
});

export const applyCoupon = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const { code, restaurantId, orderAmount, deliveryFee } = req.body;
  const coupon = await couponService.validateCouponCode(code as string, user._id.toString(), Number(orderAmount));

  const discountAmount = coupon.calculateDiscount(Number(orderAmount), Number(deliveryFee || 0));

  return res.status(200).json({
    message: "Coupon is valid",
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      minOrderAmount: coupon.minOrderAmount
    },
    success: true,
    error: false
  });
});

export const getCouponAnalytics = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    throw new AuthorizationError("Access denied");
  }

  const id = req.params["id"] as string;
  const sellerRestaurantId = user.restaurantId || null;

  const analytics = await couponService.getCouponAnalytics(id, sellerRestaurantId, user.role);

  return res.status(200).json({
    message: "Coupon analytics fetched successfully",
    data: analytics,
    success: true,
    error: false
  });
});
