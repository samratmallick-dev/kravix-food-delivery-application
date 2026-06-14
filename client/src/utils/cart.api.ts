import { request } from "./request";
import { cartBaseUrl } from "../components/common/constant";
import type { ApiResponse, SuccessResponse } from "../types/api.types";
import type { ICart } from "../types/types";

export interface AddToCartPayload {
      restaurantId: string;
      itemId: string;
}

export interface UpdateCartQuantityPayload {
      itemId: string;
}

export interface FetchCartResponse {
      cart: ICart[];
      cartLength: number;
      subTotal: number;
}

export const addToCart = (payload: AddToCartPayload): Promise<ApiResponse<ICart>> =>
      request<ApiResponse<ICart>>(`${cartBaseUrl}/`, {
            method: "POST",
            body: JSON.stringify(payload),
      });

export const fetchCart = (token?: string): Promise<ApiResponse<FetchCartResponse>> =>
      request<ApiResponse<FetchCartResponse>>(`${cartBaseUrl}/`, {
            method: "GET",
      }, token);

export const incrementCartQuantity = (
      payload: UpdateCartQuantityPayload,
): Promise<ApiResponse<ICart>> =>
      request<ApiResponse<ICart>>(`${cartBaseUrl}/increment`, {
            method: "PATCH",
            body: JSON.stringify(payload),
      });

export const decrementCartQuantity = (
      payload: UpdateCartQuantityPayload,
): Promise<ApiResponse<ICart>> =>
      request<ApiResponse<ICart>>(`${cartBaseUrl}/decrement`, {
            method: "PATCH",
            body: JSON.stringify(payload),
      });

export const clearCart = (): Promise<SuccessResponse> =>
      request<SuccessResponse>(`${cartBaseUrl}/`, {
            method: "DELETE",
      });
