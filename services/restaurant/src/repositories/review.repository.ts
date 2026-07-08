import { IReviewRepository } from "../interfaces/IReviewRepository.js";
import { Review as ReviewModel } from "../model/Review.js";

export class ReviewRepository implements IReviewRepository {
  async find(restaurantId: string): Promise<any[]> {
    return await ReviewModel.find({ restaurantId, type: "restaurant", status: "approved" })
      .sort({ createdAt: -1 })
      .lean();
  }

  async create(reviewData: any): Promise<any> {
    return await ReviewModel.create(reviewData);
  }

  async getAverageRating(restaurantId: string): Promise<number> {
    const res = await ReviewModel.aggregate([
      { $match: { restaurantId, type: "restaurant", status: "approved" } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);
    return res[0]?.avgRating ? +res[0].avgRating.toFixed(1) : 0;
  }

  async findRiderReviews(riderId: string): Promise<any[]> {
    return await ReviewModel.find({ riderId, type: "rider", status: "approved" })
      .sort({ createdAt: -1 })
      .lean();
  }

  async getRiderAverageRating(riderId: string): Promise<number> {
    const res = await ReviewModel.aggregate([
      { $match: { riderId, type: "rider", status: "approved" } },
      { $group: { _id: null, averageRating: { $avg: "$rating" } } }
    ]);
    return res[0]?.averageRating ? +res[0].averageRating.toFixed(1) : 0;
  }

  async findById(id: string): Promise<any> {
    return await ReviewModel.findById(id);
  }

  async update(review: any): Promise<any> {
    return await review.save();
  }

  async findReviews(query: any): Promise<any[]> {
    return await ReviewModel.find(query).sort({ updatedAt: -1 }).lean();
  }

  async delete(id: string): Promise<void> {
    await ReviewModel.findByIdAndDelete(id);
  }
}
