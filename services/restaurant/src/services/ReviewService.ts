import { IReviewService } from "../interfaces/IReviewService.js";
import { IReviewRepository } from "../interfaces/IReviewRepository.js";
import { IOrderRepository } from "../interfaces/IOrderRepository.js";
import { IRestaurantEventPublisher } from "../interfaces/IRestaurantEventPublisher.js";
import { NotFoundError, ValidationError, AuthorizationError } from "../utils/errors.js";

export class ReviewService implements IReviewService {
  constructor(
    private reviewRepository: IReviewRepository,
    private orderRepository: IOrderRepository,
    private eventPublisher: IRestaurantEventPublisher
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

    if (type === "rider" && riderId) {
      await this.eventPublisher.publishRiderRated(riderId, rating);
    }

    return review;
  }

  async getRestaurantReviews(restaurantId: string, rating?: number, sortBy?: string, order?: string): Promise<{ reviews: any[]; ratingsSummary: any }> {
    const raw = await this.reviewRepository.find(restaurantId);

    let reviews = raw;
    if (rating) {
      reviews = reviews.filter((r) => r.rating === Number(rating));
    }

    const field = sortBy || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;
    reviews.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (valA < valB) return -sortOrder;
      if (valA > valB) return sortOrder;
      return 0;
    });

    const averageRating = await this.reviewRepository.getAverageRating(restaurantId);
    const starCounts = { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0 };
    for (const r of raw) {
      if (r.rating === 1) starCounts.star1++;
      if (r.rating === 2) starCounts.star2++;
      if (r.rating === 3) starCounts.star3++;
      if (r.rating === 4) starCounts.star4++;
      if (r.rating === 5) starCounts.star5++;
    }

    return {
      reviews,
      ratingsSummary: {
        averageRating,
        totalReviews: raw.length,
        ...starCounts
      }
    };
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

    return await this.reviewRepository.update(review);
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
      await this.reviewRepository.delete(reviewId);
      return { id: reviewId, deleted: true };
    }

    review.status = action === "approve" ? "approved" : "flagged";
    if (action === "approve") {
      review.isReported = false;
      review.reportReason = "";
    }

    return await this.reviewRepository.update(review);
  }
}
