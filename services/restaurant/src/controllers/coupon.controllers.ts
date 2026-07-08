import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { couponService } from "../services/index.js";
import { RestaurantValidator } from "../validators/restaurant.validator.js";
import { AuthorizationError } from "../utils/errors.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const createCoupon = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  if (user.role !== "admin" && user.role !== "seller") {
    throw new AuthorizationError("Access denied");
  }

  const validData = RestaurantValidator.validateCoupon(req.body);
  const couponType = (req.body.couponType as string) || "global";
  const bodyRestaurantId = (req.body.restaurantId as string) || null;
  const targetRestaurantId = user.role === "seller" ? (user.restaurantId || null) : (couponType === "restaurant" ? bodyRestaurantId : null);

  const coupon = await couponService.createCoupon(targetRestaurantId, validData, couponType);
  return successResponse(res, 201, "Coupon created successfully", coupon);
});

export const getCoupons = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  const { restaurantId } = req.query;

  const userRole = user ? user.role : "customer";
  const sellerRestaurantId = user ? (user.restaurantId || null) : null;
  const queryRestaurantId = restaurantId ? (restaurantId as string) : null;

  const coupons = await couponService.getCoupons(userRole, sellerRestaurantId, queryRestaurantId);
  return successResponse(res, 200, "Coupons fetched successfully", coupons);
});

export const updateCoupon = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    throw new AuthorizationError("Access denied");
  }

  const id = req.params["id"] as string;
  const sellerRestaurantId = user.restaurantId || null;
  const updated = await couponService.updateCoupon(id, sellerRestaurantId, user.role, req.body);
  return successResponse(res, 200, "Coupon updated successfully", updated);
});

export const deleteCoupon = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || (user.role !== "admin" && user.role !== "seller")) {
    throw new AuthorizationError("Access denied");
  }

  const id = req.params["id"] as string;
  const sellerRestaurantId = user.restaurantId || null;
  await couponService.deleteCoupon(id, sellerRestaurantId, user.role);
  return successResponse(res, 200, "Coupon deleted successfully");
});

export const applyCoupon = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const { code, orderAmount, deliveryFee } = req.body;
  const coupon = await couponService.validateCouponCode(code as string, user._id.toString(), Number(orderAmount));
  const discountAmount = coupon.calculateDiscount(Number(orderAmount), Number(deliveryFee || 0));

  return successResponse(res, 200, "Coupon is valid", {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    minOrderAmount: coupon.minOrderAmount
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
  return successResponse(res, 200, "Coupon analytics fetched successfully", analytics);
});
