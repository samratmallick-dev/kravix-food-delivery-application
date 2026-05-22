import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { Review } from "../model/Review.js";
import { Order } from "../model/Order.js";
import { publishEvent } from "../config/orderPublisher.js";

export const createReview = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({ message: "User not authenticated", success: false, error: true });
      }

      const {
            orderId,
            restaurantId,
            menuItemId,
            riderId,
            rating,
            comment,
            type
      } = req.body;

      if (!orderId || !restaurantId || rating === undefined || !comment || !type) {
            return res.status(400).json({ message: "Missing required fields", success: false, error: true });
      }

      if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5", success: false, error: true });
      }

      if (!["restaurant", "menu_item", "rider"].includes(type)) {
            return res.status(400).json({ message: "Invalid review type", success: false, error: true });
      }

      const order = await Order.findById(orderId);
      if (!order) {
            return res.status(404).json({ message: "Order not found", success: false, error: true });
      }

      if (order.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "You can only review your own orders", success: false, error: true });
      }

      if (order.status !== "delivered") {
            return res.status(400).json({ message: "You can only review delivered orders", success: false, error: true });
      }

      const duplicateQuery: any = {
            orderId,
            userId: user._id,
            type
      };
      if (type === "menu_item") {
            duplicateQuery.menuItemId = menuItemId;
      }
      if (type === "rider") {
            duplicateQuery.riderId = riderId;
      }

      const existingReview = await Review.findOne(duplicateQuery);
      if (existingReview) {
            return res.status(400).json({ message: `You have already reviewed the ${type} for this order`, success: false, error: true });
      }

      const review = await Review.create({
            userId: user._id,
            userName: user.name,
            userImage: user.image || "",
            orderId,
            restaurantId,
            menuItemId: type === "menu_item" ? menuItemId : null,
            riderId: type === "rider" ? riderId : null,
            rating,
            comment,
            type,
            status: "approved" 
      });

      if (type === "rider" && riderId) {
            try {
                  await publishEvent("RIDER_RATED", { riderId, rating }, process.env.RIDER_QUEUE!);
                  console.log(`Published RIDER_RATED event for rider: ${riderId}`);
            } catch (err) {
                  console.error("Failed to publish RIDER_RATED event:", err);
            }
      }

      return res.status(201).json({
            message: "Review submitted successfully",
            data: review,
            success: true,
            error: false
      });
});

export const getRestaurantReviews = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params; // restaurantId
      const { rating, sortBy = "createdAt", order = "desc" } = req.query;

      const filter: any = {
            restaurantId: id,
            type: "restaurant",
            status: "approved"
      };

      if (rating) {
            filter.rating = Number(rating);
      }

      const sortOrder = order === "asc" ? 1 : -1;
      const sortQuery: any = {};
      sortQuery[sortBy as string] = sortOrder;

      const reviews = await Review.find(filter).sort(sortQuery);

      const summary = await Review.aggregate([
            { $match: { restaurantId: id, type: "restaurant", status: "approved" } },
            {
                  $group: {
                        _id: null,
                        averageRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 },
                        star1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
                        star2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
                        star3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
                        star4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
                        star5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } }
                  }
            }
      ]);

      const ratingsSummary = summary[0] || {
            averageRating: 0,
            totalReviews: 0,
            star1: 0,
            star2: 0,
            star3: 0,
            star4: 0,
            star5: 0
      };

      ratingsSummary.averageRating = Math.round(ratingsSummary.averageRating * 10) / 10;

      return res.status(200).json({
            message: "Restaurant reviews fetched successfully",
            data: {
                  reviews,
                  ratingsSummary
            },
            success: true,
            error: false
      });
});

export const getRiderReviews = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params; 

      const reviews = await Review.find({
            riderId: id,
            type: "rider",
            status: "approved"
      } as any).sort({ createdAt: -1 });

      const summary = await Review.aggregate([
            { $match: { riderId: id, type: "rider", status: "approved" } },
            {
                  $group: {
                        _id: null,
                        averageRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 }
                  }
            }
      ]);

      const ratingsSummary = summary[0] || { averageRating: 0, totalReviews: 0 };
      ratingsSummary.averageRating = Math.round(ratingsSummary.averageRating * 10) / 10;

      return res.status(200).json({
            message: "Rider reviews fetched successfully",
            data: {
                  reviews,
                  ratingsSummary
            },
            success: true,
            error: false
      });
});

export const reportReview = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user) {
            return res.status(401).json({ message: "User not authenticated", success: false, error: true });
      }

      const { reviewId, reason } = req.body;
      if (!reviewId || !reason) {
            return res.status(400).json({ message: "Review ID and reason are required", success: false, error: true });
      }

      const review = await Review.findById(reviewId);
      if (!review) {
            return res.status(404).json({ message: "Review not found", success: false, error: true });
      }

      review.isReported = true;
      review.reportReason = reason;
      review.status = "flagged";
      await review.save();

      return res.status(200).json({
            message: "Review has been reported and flagged for moderation",
            data: review,
            success: true,
            error: false
      });
});

export const getAdminReviews = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only.", success: false, error: true });
      }

      const { reportedOnly = "false" } = req.query;

      const query: any = {};
      if (reportedOnly === "true") {
            query.isReported = true;
      }

      const reviews = await Review.find(query).sort({ updatedAt: -1 });

      return res.status(200).json({
            message: "Reviews fetched for moderation",
            data: reviews,
            success: true,
            error: false
      });
});

export const moderateReview = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
      const user = req.user;
      if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only.", success: false, error: true });
      }

      const { id } = req.params;
      const { action } = req.body; 

      if (!action || !["approve", "reject", "delete"].includes(action)) {
            return res.status(400).json({ message: "Valid action is required", success: false, error: true });
      }

      const review = await Review.findById(id);
      if (!review) {
            return res.status(404).json({ message: "Review not found", success: false, error: true });
      }

      if (action === "delete") {
            await Review.findByIdAndDelete(id);
            return res.status(200).json({
                  message: "Review deleted successfully",
                  success: true,
                  error: false
            });
      }

      review.status = action === "approve" ? "approved" : "flagged";
      if (action === "approve") {
            review.isReported = false;
            review.reportReason = "";
      }
      await review.save();

      return res.status(200).json({
            message: `Review ${action}d successfully`,
            data: review,
            success: true,
            error: false
      });
});
