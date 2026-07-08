import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { reviewService } from "../services/index.js";
import { RestaurantValidator } from "../validators/restaurant.validator.js";
import { AuthorizationError } from "../utils/errors.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const createReview = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
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

  return successResponse(res, 201, "Review submitted successfully", review);
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

  return successResponse(res, 200, "Restaurant reviews fetched successfully", result);
});

export const getRiderReviews = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const result = await reviewService.getRiderReviews(id as string);
  return successResponse(res, 200, "Rider reviews fetched successfully", result);
});

export const reportReview = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
  }

  const { reviewId, reason } = req.body;
  const review = await reviewService.reportReview(reviewId, reason);
  return successResponse(res, 200, "Review has been reported and flagged for moderation", review);
});

export const getAdminReviews = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    throw new AuthorizationError("Access denied. Admins only.");
  }

  const { reportedOnly = "false" } = req.query;
  const reviews = await reviewService.getAdminReviews(reportedOnly === "true");
  return successResponse(res, 200, "Reviews fetched for moderation", reviews);
});

export const moderateReview = TryCatch(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    throw new AuthorizationError("Access denied. Admins only.");
  }

  const { id } = req.params;
  const { action } = req.body;
  const review = await reviewService.moderateReview(id as string, action);
  return successResponse(res, 200, `Review ${action}d successfully`, review);
});
