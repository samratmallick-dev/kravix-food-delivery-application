import { couponBaseUrl } from "@/constants";
import { request } from "@/services/apiClient";
import type { ApiResponse, SuccessResponse, ICoupon } from "@/types";

export interface CreateCouponPayload {
      code: string;
      discountType: "percentage" | "flat" | "free_delivery";
      discountValue: number;
      maxDiscountAmount?: number;
      minOrderAmount?: number;
      expiryDate: string | Date;
      usageLimit?: number;
      perUserLimit?: number;
      couponType?: "global" | "restaurant";
      restaurantId?: string;
}

export interface ApplyCouponPayload {
      code: string;
      restaurantId: string;
      orderAmount: number;
      deliveryFee?: number;
}

export interface ApplyCouponResponse {
      code: string;
      discountType: string;
      discountValue: number;
      discountAmount: number;
      minOrderAmount: number;
}

export interface CouponAnalyticsResponse {
      coupon: ICoupon;
      totalRedemptions: number;
      totalDiscountAmount: number;
      usages: any[];
}

export const createCoupon = (payload: CreateCouponPayload): Promise<ApiResponse<ICoupon>> =>
      request<ApiResponse<ICoupon>>(`${couponBaseUrl}/`, {
            method: "POST",
            body: JSON.stringify(payload),
      });

export const getCoupons = (restaurantId?: string): Promise<ApiResponse<ICoupon[]>> => {
      const url = restaurantId ? `${couponBaseUrl}/?restaurantId=${restaurantId}` : `${couponBaseUrl}/`;
      return request<ApiResponse<ICoupon[]>>(url, {
            method: "GET",
      });
};

export const applyCoupon = (payload: ApplyCouponPayload): Promise<ApiResponse<ApplyCouponResponse>> =>
      request<ApiResponse<ApplyCouponResponse>>(`${couponBaseUrl}/apply`, {
            method: "POST",
            body: JSON.stringify(payload),
      });

export const getCouponAnalytics = (couponId: string): Promise<ApiResponse<CouponAnalyticsResponse>> =>
      request<ApiResponse<CouponAnalyticsResponse>>(`${couponBaseUrl}/analytics/${couponId}`, {
            method: "GET",
      });

export const updateCoupon = (couponId: string, payload: Partial<CreateCouponPayload>): Promise<ApiResponse<ICoupon>> =>
      request<ApiResponse<ICoupon>>(`${couponBaseUrl}/${couponId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
      });

export const deleteCoupon = (couponId: string): Promise<SuccessResponse> =>
      request<SuccessResponse>(`${couponBaseUrl}/${couponId}`, {
            method: "DELETE",
      });
