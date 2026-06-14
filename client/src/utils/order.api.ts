import { request } from "./request";
import { orderBaseUrl } from "../components/common/constant";
import type { ApiResponse, SuccessResponse } from "../types/api.types";
import type { IOrder } from "../types/types";

export interface CreateOrderPayload {
      paymentMethod: string;
      addressId: string;
      couponCode?: string;
}

export interface ReorderResponse {
      cartItemCount: number;
      restaurantId: string;
}

export interface FetchOrdersResponse {
      count: number;
      orders: IOrder[];
}

export interface SalesStatsResponse {
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      revenueByDay: { date: string; amount: number }[];
}

export const createOrder = (payload: CreateOrderPayload): Promise<ApiResponse<{ orderId: string; totalAmount: number; paymentMethod: string }>> =>
      request<ApiResponse<{ orderId: string; totalAmount: number; paymentMethod: string }>>(`${orderBaseUrl}/`, {
            method: "POST",
            body: JSON.stringify(payload),
      });

export const getMyOrders = (): Promise<ApiResponse<FetchOrdersResponse>> =>
      request<ApiResponse<FetchOrdersResponse>>(`${orderBaseUrl}/me`, {
            method: "GET",
      });

export const getSingleOrder = (orderId: string): Promise<ApiResponse<IOrder>> =>
      request<ApiResponse<IOrder>>(`${orderBaseUrl}/me/${orderId}`, {
            method: "GET",
      });

export const cancelMyOrder = (orderId: string): Promise<SuccessResponse> =>
      request<SuccessResponse>(`${orderBaseUrl}/me/${orderId}/cancel`, {
            method: "PATCH",
      });

export const reorderItems = (orderId: string): Promise<ApiResponse<ReorderResponse>> =>
      request<ApiResponse<ReorderResponse>>(`${orderBaseUrl}/reorder/${orderId}`, {
            method: "POST",
      });

export const fetchRestaurantOrders = (restaurantId: string): Promise<ApiResponse<FetchOrdersResponse>> =>
      request<ApiResponse<FetchOrdersResponse>>(`${orderBaseUrl}/restaurants/${restaurantId}`, {
            method: "GET",
      });

export const getRestaurantSalesStats = (restaurantId: string): Promise<ApiResponse<SalesStatsResponse>> =>
      request<ApiResponse<SalesStatsResponse>>(`${orderBaseUrl}/restaurants/${restaurantId}/sales-stats`, {
            method: "GET",
      });

export const updateOrderStatus = (orderId: string, status: string): Promise<ApiResponse<IOrder>> =>
      request<ApiResponse<IOrder>>(`${orderBaseUrl}/${orderId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
      });
