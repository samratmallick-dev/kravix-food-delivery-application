export interface IReviewService {
  addReview(
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
  ): Promise<any>;
  getRestaurantReviews(restaurantId: string, rating?: number, sortBy?: string, order?: string): Promise<{ reviews: any[]; ratingsSummary: any }>;
  getRiderReviews(riderId: string): Promise<{ reviews: any[]; ratingsSummary: any }>;
  reportReview(reviewId: string, reason: string): Promise<any>;
  getAdminReviews(reportedOnly: boolean): Promise<any[]>;
  moderateReview(reviewId: string, action: string): Promise<any>;
}
