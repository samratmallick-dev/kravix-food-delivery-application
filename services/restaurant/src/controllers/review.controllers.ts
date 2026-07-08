import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { reviewService } from "../services/index.js";
import { RestaurantValidator } from "../validators/restaurant.validator.js";
import { AuthorizationError } from "../utils/errors.js";

export const createReview = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const validData = RestaurantValidator.validateReview(req.body);
  const { restaurantId, riderId, type } = req.body;

  const review = await reviewService.addReview(
    user._id.toString(),
    user.name,
    user.image || "",
    validData.orderId,
    restaurantId,
    validData.menuItemId,
    riderId,
    validData.rating,
    validData.comment,
    type
  );

  return res.status(201).json({
    message: "Review submitted successfully",
    data: review,
    success: true,
    error: false
  });
});

export const getRestaurantReviews = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { rating, sortBy, order } = req.query;

  const result = await reviewService.getRestaurantReviews(
    id as string,
    rating ? Number(rating) : undefined,
    sortBy as string,
    order as string
  );

  return res.status(200).json({
    message: "Restaurant reviews fetched successfully",
    data: result,
    success: true,
    error: false
  });
});

export const getRiderReviews = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const result = await reviewService.getRiderReviews(id as string);

  return res.status(200).json({
    message: "Rider reviews fetched successfully",
    data: result,
    success: true,
    error: false
  });
});

export const reportReview = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "User not authenticated", success: false, error: true });
  }

  const { reviewId, reason } = req.body;
  const review = await reviewService.reportReview(reviewId, reason);

  return res.status(200).json({
    message: "Review has been reported and flagged for moderation",
    data: review,
    success: true,
    error: false
  });
});

export const getAdminReviews = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    throw new AuthorizationError("Access denied. Admins only.");
  }

  const { reportedOnly = "false" } = req.query;
  const reviews = await reviewService.getAdminReviews(reportedOnly === "true");

  return res.status(200).json({
    message: "Reviews fetched for moderation",
    data: reviews,
    success: true,
    error: false
  });
});

export const moderateReview = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    throw new AuthorizationError("Access denied. Admins only.");
  }

  const { id } = req.params;
  const { action } = req.body;

  const review = await reviewService.moderateReview(id as string, action);

  return res.status(200).json({
    message: `Review ${action}d successfully`,
    data: review,
    success: true,
    error: false
  });
});
