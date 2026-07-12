import { adminBaseUrl, reviewBaseUrl, couponBaseUrl, analyticsBaseUrl } from "@/constants";
import { request } from "@/services/apiClient";
import { storage } from "@/utils";
import type { ApiResponse, SuccessResponse } from "@/types";

const adminReq = <T>(path: string, options?: RequestInit) =>
      request<T>(path, options, storage.getAdminToken() ?? undefined);

export const adminLogin = (email: string, password: string): Promise<ApiResponse<{ token: string }>> =>
      adminReq<ApiResponse<{ token: string }>>(`${adminBaseUrl}/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
      });

export const getAdminDashboard = (): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/dashboard`, {
            method: "GET",
      });

export const getAllUsers = (params?: any): Promise<ApiResponse<any>> => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return adminReq<ApiResponse<any>>(`${adminBaseUrl}/users${qs}`, {
            method: "GET",
      });
};

export const getUserById = (userId: string): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/users/${userId}`, {
            method: "GET",
      });

export const blockUser = (userId: string, isBlocked: boolean): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/users/${userId}/block`, {
            method: "PATCH",
            body: JSON.stringify({ isBlocked }),
      });

export const getAllRestaurants = (params?: any): Promise<ApiResponse<any>> => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return adminReq<ApiResponse<any>>(`${adminBaseUrl}/restaurants${qs}`, {
            method: "GET",
      });
};

export const getRestaurantById = (restaurantId: string): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/restaurants/${restaurantId}`, {
            method: "GET",
      });

export const verifyRestaurant = (restaurantId: string, isVerified = true): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/restaurants/${restaurantId}/verify`, {
            method: "PATCH",
            body: JSON.stringify({ isVerified }),
      });

export const deleteRestaurant = (restaurantId: string): Promise<SuccessResponse> =>
      adminReq<SuccessResponse>(`${adminBaseUrl}/restaurants/${restaurantId}`, {
            method: "DELETE",
      });

export const approveLocationUpdate = (
      restaurantId: string,
      payload?: { reason?: string; locationVersion?: number }
): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/restaurants/${restaurantId}/location/approve`, {
            method: "PATCH",
            body: JSON.stringify(payload || {}),
      });

export const rejectLocationUpdate = (
      restaurantId: string,
      payload?: { reason?: string; locationVersion?: number }
): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/restaurants/${restaurantId}/location/reject`, {
            method: "PATCH",
            body: JSON.stringify(payload || {}),
      });

export const getAllRiders = (params?: any): Promise<ApiResponse<any>> => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return adminReq<ApiResponse<any>>(`${adminBaseUrl}/riders${qs}`, {
            method: "GET",
      });
};

export const getRiderById = (riderId: string): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/riders/${riderId}`, {
            method: "GET",
      });

export const verifyRider = (riderId: string, isVerified = true): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/riders/${riderId}/verify`, {
            method: "PATCH",
            body: JSON.stringify({ isVerified }),
      });

export const deleteRider = (riderId: string): Promise<SuccessResponse> =>
      adminReq<SuccessResponse>(`${adminBaseUrl}/riders/${riderId}`, {
            method: "DELETE",
      });

export const getAllOrders = (params?: any): Promise<ApiResponse<any>> => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return adminReq<ApiResponse<any>>(`${adminBaseUrl}/orders${qs}`, {
            method: "GET",
      });
};

export const getOrderById = (orderId: string): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${adminBaseUrl}/orders/${orderId}`, {
            method: "GET",
      });

export const cancelOrder = (orderId: string): Promise<SuccessResponse> =>
      adminReq<SuccessResponse>(`${adminBaseUrl}/orders/${orderId}/cancel`, {
            method: "PATCH",
      });

export const getAllReviews = (params?: any): Promise<ApiResponse<any>> => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return adminReq<ApiResponse<any>>(`${reviewBaseUrl}/admin${qs}`, {
            method: "GET",
      });
};

export const moderateReview = (id: string, payload: { status: string; moderationReason?: string }): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${reviewBaseUrl}/admin/moderate/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
      });

export const getAllCoupons = (params?: any): Promise<ApiResponse<any>> => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return adminReq<ApiResponse<any>>(`${couponBaseUrl}${qs}`, {
            method: "GET",
      });
};

export const createCoupon = (payload: any): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${couponBaseUrl}`, {
            method: "POST",
            body: JSON.stringify(payload),
      });

export const updateCoupon = (id: string, payload: any): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${couponBaseUrl}/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
      });

export const deleteCoupon = (id: string): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${couponBaseUrl}/${id}`, {
            method: "DELETE",
      });

export const getCouponAnalytics = (id: string): Promise<ApiResponse<any>> =>
      adminReq<ApiResponse<any>>(`${couponBaseUrl}/analytics/${id}`, {
            method: "GET",
      });

export const getAdminAnalytics = (params?: any): Promise<ApiResponse<any>> => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return adminReq<ApiResponse<any>>(`${analyticsBaseUrl}${qs}`, {
            method: "GET",
      });
};

export const exportAdminAnalytics = (params?: any): Promise<Blob> => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return fetch(`${analyticsBaseUrl}/export${qs}`, {
            headers: {
                  Authorization: `Bearer ${storage.getAdminToken()}`
            }
      }).then(res => res.blob());
};
