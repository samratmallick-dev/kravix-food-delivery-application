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

  async getReviewsWithSummary(
    restaurantId: string,
    params: { rating?: number; sortBy?: string; order?: string }
  ): Promise<any> {
    const { rating, sortBy = "createdAt", order = "desc" } = params;
    const baseMatch: any = { restaurantId, type: "restaurant", status: "approved" };
    const sortField = sortBy === "rating" ? "rating" : "createdAt";
    const sortDir = order === "asc" ? 1 : -1;

    const reviewPipeline: any[] = [{ $sort: { [sortField]: sortDir } }];
    if (rating) {
      reviewPipeline.unshift({ $match: { rating: Number(rating) } });
    }

    const result = await ReviewModel.aggregate([
      { $match: baseMatch },
      {
        $facet: {
          reviews: reviewPipeline,
          summary: [
            {
              $group: {
                _id: null,
                avgRating: { $avg: "$rating" },
                total: { $sum: 1 },
                star1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
                star2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
                star3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
                star4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
                star5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } }
              }
            }
          ]
        }
      }
    ]);

    const facetResult = result[0] ?? { reviews: [], summary: [] };
    const s = facetResult.summary[0] ?? {};

    return {
      reviews: facetResult.reviews,
      summary: {
        averageRating: s.avgRating ? +s.avgRating.toFixed(1) : 0,
        totalReviews: s.total ?? 0,
        star1: s.star1 ?? 0,
        star2: s.star2 ?? 0,
        star3: s.star3 ?? 0,
        star4: s.star4 ?? 0,
        star5: s.star5 ?? 0
      }
    };
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
