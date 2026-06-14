import { request } from "./request";
import { reviewBaseUrl } from "../components/common/constant";
import type { ApiResponse } from "../types/api.types";
import type { IReview } from "../types/types";
import { buildQueryString } from "./query";

export interface CreateReviewPayload {
      orderId: string;
      restaurantId: string;
      menuItemId?: string;
      riderId?: string;
      rating: number;
      comment: string;
      type: "restaurant" | "menu_item" | "rider";
}

export interface ReviewRatingsSummary {
      averageRating: number;
      totalReviews: number;
      star1?: number;
      star2?: number;
      star3?: number;
      star4?: number;
      star5?: number;
}

export interface GetReviewsResponse {
      reviews: IReview[];
      ratingsSummary: ReviewRatingsSummary;
}

export const createReview = (payload: CreateReviewPayload): Promise<ApiResponse<IReview>> =>
      request<ApiResponse<IReview>>(`${reviewBaseUrl}/`, {
            method: "POST",
            body: JSON.stringify(payload),
      });

export interface GetRestaurantReviewsParams {
      rating?: number | null;
      sortBy?: string;
      order?: string;
}

export const getRestaurantReviews = (restaurantId: string, params?: GetRestaurantReviewsParams): Promise<ApiResponse<GetReviewsResponse>> => {
      const qs = buildQueryString(params as any);
      return request<ApiResponse<GetReviewsResponse>>(`${reviewBaseUrl}/restaurant/${restaurantId}${qs}`, {
            method: "GET",
      });
};

export const getRiderReviews = (riderId: string): Promise<ApiResponse<GetReviewsResponse>> =>
      request<ApiResponse<GetReviewsResponse>>(`${reviewBaseUrl}/rider/${riderId}`, {
            method: "GET",
      });

export const reportReview = (reviewId: string, reason: string): Promise<ApiResponse<IReview>> =>
      request<ApiResponse<IReview>>(`${reviewBaseUrl}/report`, {
            method: "POST",
            body: JSON.stringify({ reviewId, reason }),
      });

export const getAdminReviews = (reportedOnly?: boolean): Promise<ApiResponse<IReview[]>> => {
      const url = reportedOnly ? `${reviewBaseUrl}/admin?reportedOnly=true` : `${reviewBaseUrl}/admin`;
      return request<ApiResponse<IReview[]>>(url, {
            method: "GET",
      });
};

export const moderateReview = (reviewId: string, action: "approve" | "reject" | "delete"): Promise<ApiResponse<IReview | null>> =>
      request<ApiResponse<IReview | null>>(`${reviewBaseUrl}/admin/moderate/${reviewId}`, {
            method: "PUT",
            body: JSON.stringify({ action }),
      });
