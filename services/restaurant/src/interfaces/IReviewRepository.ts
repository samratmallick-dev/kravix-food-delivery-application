export interface IReviewRepository {
  find(restaurantId: string): Promise<any[]>;
  create(reviewData: any): Promise<any>;
  getAverageRating(restaurantId: string): Promise<number>;
  findRiderReviews(riderId: string): Promise<any[]>;
  getRiderAverageRating(riderId: string): Promise<number>;
  findById(id: string): Promise<any>;
  update(review: any): Promise<any>;
  findReviews(query: any): Promise<any[]>;
  delete(id: string): Promise<void>;
}
