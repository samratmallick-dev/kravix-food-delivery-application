import { IReviewService } from "../interfaces/IReviewService.js";
import { IReviewRepository } from "../interfaces/IReviewRepository.js";
import { IOrderRepository } from "../interfaces/IOrderRepository.js";
import { IRestaurantEventPublisher } from "../interfaces/IRestaurantEventPublisher.js";
import { ICache } from "../interfaces/ICache.js";
import { NotFoundError, ValidationError, AuthorizationError } from "../utils/errors.js";

export class ReviewService implements IReviewService {
  constructor(
    private reviewRepository: IReviewRepository,
    private orderRepository: IOrderRepository,
    private eventPublisher: IRestaurantEventPublisher,
    private cache?: ICache
  ) {}

  async addReview(
    userId: string,
    userName: string,
    userImage: string,
    orderId: string,
    restaurantId: string,
    menuItemId: string | null | undefined,
    riderId: string | null | undefined,
    rating: number,
    comment: string,
    type: string
  ): Promise<any> {
    if (rating < 1 || rating > 5) {
      throw new ValidationError("Rating must be between 1 and 5");
    }
    if (!["restaurant", "menu_item", "rider"].includes(type)) {
      throw new ValidationError("Invalid review type");
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.userId !== userId) {
      throw new AuthorizationError("You can only review your own orders");
    }
    if (order.status !== "delivered") {
      throw new ValidationError("You can only review delivered orders");
    }

    const duplicateQuery: any = { orderId, userId, type };
    if (type === "menu_item") {
      duplicateQuery.menuItemId = menuItemId;
    }
    if (type === "rider") {
      duplicateQuery.riderId = riderId;
    }

    const reviews = await this.reviewRepository.findReviews(duplicateQuery);
    if (reviews.length > 0) {
      throw new ValidationError(`You have already reviewed the ${type} for this order`);
    }

    const reviewData = {
      userId,
      userName,
      userImage: userImage || "",
      orderId,
      restaurantId,
      menuItemId: type === "menu_item" ? menuItemId : null,
      riderId: type === "rider" ? (riderId || null) : null,
      rating,
      comment,
      type,
      status: "approved",
      isReported: false,
      reportReason: ""
    };

    const review = await this.reviewRepository.create(reviewData);

    if (type === "restaurant" && restaurantId) {
      await this.invalidateReviewCache(restaurantId);
    }

    if (type === "rider" && riderId) {
      await this.eventPublisher.publishRiderRated(riderId, rating);
    }

    return review;
  }

  private async invalidateReviewCache(restaurantId: string): Promise<void> {
    if (this.cache) {
      const ratings = ["all", "1", "2", "3", "4", "5"];
      const sortBys = ["createdAt", "rating"];
      const orders = ["desc", "asc"];
      const promises: Promise<void>[] = [];
      for (const r of ratings) {
        for (const s of sortBys) {
          for (const o of orders) {
            promises.push(this.cache.delete(`restaurant:${restaurantId}:reviews:${r}:${s}:${o}`));
          }
        }
      }
      await Promise.all(promises);
    }
  }

  async getRestaurantReviews(restaurantId: string, rating?: number, sortBy?: string, order?: string): Promise<{ reviews: any[]; ratingsSummary: any }> {
    const cacheKey = `restaurant:${restaurantId}:reviews:${rating ?? "all"}:${sortBy ?? "createdAt"}:${order ?? "desc"}`;
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const params: { rating?: number; sortBy?: string; order?: string } = {};
    if (rating !== undefined) params.rating = rating;
    if (sortBy !== undefined) params.sortBy = sortBy;
    if (order !== undefined) params.order = order;

    const { reviews, summary } = await this.reviewRepository.getReviewsWithSummary(
      restaurantId,
      params
    );

    const result = {
      reviews,
      ratingsSummary: summary
    };

    if (this.cache) {
      await this.cache.set(cacheKey, result, 60);
    }

    return result;
  }


  async getRiderReviews(riderId: string): Promise<{ reviews: any[]; ratingsSummary: any }> {
    const reviews = await this.reviewRepository.findRiderReviews(riderId);
    const averageRating = await this.reviewRepository.getRiderAverageRating(riderId);

    return {
      reviews,
      ratingsSummary: {
        averageRating,
        totalReviews: reviews.length
      }
    };
  }

  async reportReview(reviewId: string, reason: string): Promise<any> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    review.isReported = true;
    review.reportReason = reason;
    review.status = "flagged";

    const updated = await this.reviewRepository.update(review);
    if (updated.type === "restaurant" && updated.restaurantId) {
      await this.invalidateReviewCache(updated.restaurantId);
    }
    return updated;
  }

  async getAdminReviews(reportedOnly: boolean): Promise<any[]> {
    const query: any = {};
    if (reportedOnly) {
      query.isReported = true;
    }
    return await this.reviewRepository.findReviews(query);
  }

  async moderateReview(reviewId: string, action: string): Promise<any> {
    if (!["approve", "reject", "delete"].includes(action)) {
      throw new ValidationError("Valid action is required");
    }

    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (action === "delete") {
      const restaurantId = review.restaurantId;
      const type = review.type;
      await this.reviewRepository.delete(reviewId);
      if (type === "restaurant" && restaurantId) {
        await this.invalidateReviewCache(restaurantId);
      }
      return { id: reviewId, deleted: true };
    }

    review.status = action === "approve" ? "approved" : "flagged";
    if (action === "approve") {
      review.isReported = false;
      review.reportReason = "";
    }

    const updated = await this.reviewRepository.update(review);
    if (updated.type === "restaurant" && updated.restaurantId) {
      await this.invalidateReviewCache(updated.restaurantId);
    }
    return updated;
  }
}
