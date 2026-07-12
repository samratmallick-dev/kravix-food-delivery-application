export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  star1: number;
  star2: number;
  star3: number;
  star4: number;
  star5: number;
}

export interface ReviewsWithSummary {
  reviews: any[];
  summary: ReviewSummary;
}

export interface IReviewRepository {
  find(restaurantId: string): Promise<any[]>;
  create(reviewData: any): Promise<any>;
  getAverageRating(restaurantId: string): Promise<number>;
  getReviewsWithSummary(
    restaurantId: string,
    params: { rating?: number; sortBy?: string; order?: string }
  ): Promise<ReviewsWithSummary>;
  findRiderReviews(riderId: string): Promise<any[]>;
  getRiderAverageRating(riderId: string): Promise<number>;
  findById(id: string): Promise<any>;
  update(review: any): Promise<any>;
  findReviews(query: any): Promise<any[]>;
  delete(id: string): Promise<void>;
}
