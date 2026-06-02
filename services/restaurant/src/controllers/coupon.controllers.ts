import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Coupon } from "../model/Coupon.js";
import { CouponUsage } from "../model/CouponUsage.js";

// Create Coupon
export const createCoupon = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user) {
                  return res
                        .status(401)
                        .json({
                              message: "User not authenticated",
                              success: false,
                              error: true,
                        });
            }

            const {
                  code,
                  discountType,
                  discountValue,
                  maxDiscountAmount,
                  minOrderAmount,
                  expiryDate,
                  usageLimit,
                  perUserLimit,
                  couponType,
                  restaurantId,
            } = req.body;

            if (!code || !discountType || discountValue === undefined || !expiryDate) {
                  return res
                        .status(400)
                        .json({
                              message: "Missing required fields",
                              success: false,
                              error: true,
                        });
            }

            // Authorization checks
            if (user.role !== "admin" && user.role !== "seller") {
                  return res
                        .status(403)
                        .json({ message: "Access denied", success: false, error: true });
            }

            let targetRestaurantId = null;
            let type: "global" | "restaurant" = "global";

            if (user.role === "seller") {
                  if (!user.restaurantId) {
                        return res
                              .status(400)
                              .json({
                                    message: "Seller is not associated with any restaurant",
                                    success: false,
                                    error: true,
                              });
                  }
                  targetRestaurantId = user.restaurantId;
                  type = "restaurant";
            } else {
                  type = couponType || "global";
                  targetRestaurantId = couponType === "restaurant" ? restaurantId : null;
            }

            // Check if coupon code already exists
            const normalizedCode = code.trim().toUpperCase();
            const existing = await Coupon.findOne({ code: normalizedCode });
            if (existing) {
                  return res
                        .status(400)
                        .json({
                              message: "Coupon code already exists",
                              success: false,
                              error: true,
                        });
            }

            const coupon = await Coupon.create({
                  code: normalizedCode,
                  discountType,
                  discountValue,
                  maxDiscountAmount: maxDiscountAmount || 0,
                  minOrderAmount: minOrderAmount || 0,
                  expiryDate: new Date(expiryDate),
                  usageLimit: usageLimit || 0,
                  perUserLimit: perUserLimit !== undefined ? perUserLimit : 1,
                  couponType: type,
                  restaurantId: targetRestaurantId,
                  isActive: true,
            });

            return res.status(201).json({
                  message: "Coupon created successfully",
                  data: coupon,
                  success: true,
                  error: false,
            });
      },
);

// Get Coupons
export const getCoupons = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            const { restaurantId } = req.query;

            let query: any = {};

            if (!user) {
                  // Unauthenticated view (e.g. general customer checkout or browsing)
                  query.isActive = true;
                  query.expiryDate = { $gt: new Date() };
                  if (restaurantId) {
                        query.$or = [
                              { couponType: "global" },
                              { restaurantId: restaurantId.toString() },
                        ];
                  } else {
                        query.couponType = "global";
                  }
            } else if (user.role === "admin") {
                  // Admin sees everything
                  query = {};
            } else if (user.role === "seller") {
                  // Seller sees coupons for their restaurant
                  if (!user.restaurantId) {
                        return res
                              .status(200)
                              .json({
                                    message: "No coupons found",
                                    data: [],
                                    success: true,
                                    error: false,
                              });
                  }
                  query.restaurantId = user.restaurantId;
            } else {
                  // Customer sees active coupons
                  query.isActive = true;
                  query.expiryDate = { $gt: new Date() };
                  if (restaurantId) {
                        query.$or = [
                              { couponType: "global" },
                              { restaurantId: restaurantId.toString() },
                        ];
                  } else {
                        query.couponType = "global";
                  }
            }

            const coupons = await Coupon.find(query).sort({ createdAt: -1 });

            return res.status(200).json({
                  message: "Coupons fetched successfully",
                  data: coupons,
                  success: true,
                  error: false,
            });
      },
);

// Update Coupon
export const updateCoupon = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user || (user.role !== "admin" && user.role !== "seller")) {
                  return res
                        .status(403)
                        .json({ message: "Access denied", success: false, error: true });
            }

            const { id } = req.params;
            const coupon = await Coupon.findById(id);

            if (!coupon) {
                  return res
                        .status(404)
                        .json({ message: "Coupon not found", success: false, error: true });
            }

            // Check seller ownership
            if (user.role === "seller" && coupon.restaurantId !== user.restaurantId) {
                  return res
                        .status(403)
                        .json({
                              message: "Access denied to this coupon",
                              success: false,
                              error: true,
                        });
            }

            const updateData = { ...req.body };
            if (updateData.code) {
                  updateData.code = updateData.code.trim().toUpperCase();
                  const existing = await Coupon.findOne({
                        code: updateData.code,
                        _id: { $ne: id },
                  } as any);
                  if (existing) {
                        return res
                              .status(400)
                              .json({
                                    message: "Coupon code already exists",
                                    success: false,
                                    error: true,
                              });
                  }
            }

            const updatedCoupon = await Coupon.findByIdAndUpdate(id, updateData, {
                  new: true,
            });

            return res.status(200).json({
                  message: "Coupon updated successfully",
                  data: updatedCoupon,
                  success: true,
                  error: false,
            });
      },
);

// Delete Coupon
export const deleteCoupon = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user || (user.role !== "admin" && user.role !== "seller")) {
                  return res
                        .status(403)
                        .json({ message: "Access denied", success: false, error: true });
            }

            const { id } = req.params;
            const coupon = await Coupon.findById(id);

            if (!coupon) {
                  return res
                        .status(404)
                        .json({ message: "Coupon not found", success: false, error: true });
            }

            // Check seller ownership
            if (user.role === "seller" && coupon.restaurantId !== user.restaurantId) {
                  return res
                        .status(403)
                        .json({
                              message: "Access denied to this coupon",
                              success: false,
                              error: true,
                        });
            }

            await Coupon.findByIdAndDelete(id);

            return res.status(200).json({
                  message: "Coupon deleted successfully",
                  success: true,
                  error: false,
            });
      },
);

// Apply / Validate Coupon
export const applyCoupon = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user) {
                  return res
                        .status(401)
                        .json({
                              message: "User not authenticated",
                              success: false,
                              error: true,
                        });
            }

            const { code, restaurantId, orderAmount, deliveryFee } = req.body;

            if (!code || !restaurantId || orderAmount === undefined) {
                  return res
                        .status(400)
                        .json({
                              message: "Code, restaurantId, and orderAmount are required",
                              success: false,
                              error: true,
                        });
            }

            const normalizedCode = code.trim().toUpperCase();
            const coupon = await Coupon.findOne({ code: normalizedCode });

            if (!coupon) {
                  return res
                        .status(404)
                        .json({
                              message: "Coupon code not found",
                              success: false,
                              error: true,
                        });
            }

            if (!coupon.isActive) {
                  return res
                        .status(400)
                        .json({ message: "Coupon is inactive", success: false, error: true });
            }

            if (new Date(coupon.expiryDate) < new Date()) {
                  return res
                        .status(400)
                        .json({ message: "Coupon has expired", success: false, error: true });
            }

            if (
                  coupon.couponType === "restaurant" &&
                  coupon.restaurantId !== restaurantId
            ) {
                  return res
                        .status(400)
                        .json({
                              message: "Coupon is not valid for this restaurant",
                              success: false,
                              error: true,
                        });
            }

            if (orderAmount < coupon.minOrderAmount) {
                  return res.status(400).json({
                        message: `Minimum order amount of ₹${coupon.minOrderAmount} required to use this coupon`,
                        success: false,
                        error: true,
                  });
            }

            if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
                  return res
                        .status(400)
                        .json({
                              message: "Coupon usage limit reached",
                              success: false,
                              error: true,
                        });
            }

            if (coupon.perUserLimit > 0) {
                  const usageCount = await CouponUsage.countDocuments({
                        couponId: coupon._id,
                        userId: user._id,
                  });
                  if (usageCount >= coupon.perUserLimit) {
                        return res
                              .status(400)
                              .json({
                                    message: "You have reached your limit for this coupon",
                                    success: false,
                                    error: true,
                              });
                  }
            }

            // Calculate discount amount
            let discountAmount = 0;
            if (coupon.discountType === "percentage") {
                  discountAmount = (orderAmount * coupon.discountValue) / 100;
                  if (
                        coupon.maxDiscountAmount > 0 &&
                        discountAmount > coupon.maxDiscountAmount
                  ) {
                        discountAmount = coupon.maxDiscountAmount;
                  }
            } else if (coupon.discountType === "flat") {
                  discountAmount = coupon.discountValue;
            } else if (coupon.discountType === "free_delivery") {
                  discountAmount = deliveryFee || 0;
            }

            // Cap discount amount at order amount
            if (discountAmount > orderAmount) {
                  discountAmount = orderAmount;
            }

            return res.status(200).json({
                  message: "Coupon is valid",
                  data: {
                        code: coupon.code,
                        discountType: coupon.discountType,
                        discountValue: coupon.discountValue,
                        discountAmount: Math.round(discountAmount * 100) / 100,
                        minOrderAmount: coupon.minOrderAmount,
                  },
                  success: true,
                  error: false,
            });
      },
);

// Coupon Analytics
export const getCouponAnalytics = TryCatch(
      async (req: AuthenticatedRequest, res: Response) => {
            const user = req.user;
            if (!user || (user.role !== "admin" && user.role !== "seller")) {
                  return res
                        .status(403)
                        .json({ message: "Access denied", success: false, error: true });
            }

            const { id } = req.params;
            const coupon = await Coupon.findById(id);

            if (!coupon) {
                  return res
                        .status(404)
                        .json({ message: "Coupon not found", success: false, error: true });
            }

            if (user.role === "seller" && coupon.restaurantId !== user.restaurantId) {
                  return res
                        .status(403)
                        .json({ message: "Access denied", success: false, error: true });
            }

            const usages = await CouponUsage.find({ couponId: coupon._id })
                  .sort({ usedAt: -1 })
                  .limit(100);

            const summary = await CouponUsage.aggregate([
                  { $match: { couponId: coupon._id } },
                  {
                        $group: {
                              _id: null,
                              totalRedemptions: { $sum: 1 },
                              totalDiscountAmount: { $sum: "$discountApplied" },
                        },
                  },
            ]);

            const totalRedemptions = summary[0]?.totalRedemptions || 0;
            const totalDiscountAmount = summary[0]?.totalDiscountAmount || 0;

            return res.status(200).json({
                  message: "Coupon analytics fetched successfully",
                  data: {
                        coupon,
                        totalRedemptions,
                        totalDiscountAmount,
                        usages,
                  },
                  success: true,
                  error: false,
            });
      },
);
