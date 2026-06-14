import { request } from "./request";
import { restaurantBaseUrl } from "../components/common/constant";
import { buildQueryString } from "./query";
import type { ApiResponse } from "../types/api.types";
import type { IRestaurant } from "../types/types";

export interface AddRestaurantPayload {
      name: string;
      description: string;
      latitude: number;
      longitude: number;
      formattedAddress: string;
      phone: string;
      image: File;
}

export interface UpdateRestaurantPayload {
      name?: string;
      description?: string;
      image?: File;
}

export interface GetNearestRestaurantParams {
      latitude: number;
      longitude: number;
      radius?: number;
      search?: string;
}

export interface NearestRestaurantResponse {
      count: number;
      data: (IRestaurant & { distanceKm: number })[];
      correctedQuery?: string;
}

export const fetchMyRestaurant = (): Promise<ApiResponse<IRestaurant> & { token?: string }> =>
      request<ApiResponse<IRestaurant> & { token?: string }>(`${restaurantBaseUrl}/me`, {
            method: "GET",
      });

export const updateRestaurant = (payload: UpdateRestaurantPayload): Promise<ApiResponse<IRestaurant>> => {
      const formData = new FormData();
      if (payload.name) formData.append("name", payload.name);
      if (payload.description) formData.append("description", payload.description);
      if (payload.image) formData.append("image", payload.image);

      return request<ApiResponse<IRestaurant>>(`${restaurantBaseUrl}/me`, {
            method: "PATCH",
            body: formData,
      });
};

export const updateRestaurantStatus = (status: boolean): Promise<ApiResponse<IRestaurant>> =>
      request<ApiResponse<IRestaurant>>(`${restaurantBaseUrl}/me/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
      });

export const addRestaurant = (payload: AddRestaurantPayload): Promise<ApiResponse<IRestaurant> & { token: string }> => {
      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("description", payload.description);
      formData.append("latitude", payload.latitude.toString());
      formData.append("longitude", payload.longitude.toString());
      formData.append("formattedAddress", payload.formattedAddress);
      formData.append("phone", payload.phone);
      formData.append("image", payload.image);

      return request<ApiResponse<IRestaurant> & { token: string }>(`${restaurantBaseUrl}/`, {
            method: "POST",
            body: formData,
      });
};

export const getNearestRestaurant = (params: GetNearestRestaurantParams): Promise<ApiResponse<NearestRestaurantResponse['data']> & { count: number; correctedQuery?: string }> => {
      const qs = buildQueryString(params as any);
      return request<ApiResponse<NearestRestaurantResponse['data']> & { count: number; correctedQuery?: string }>(`${restaurantBaseUrl}/${qs}`, {
            method: "GET",
      });
};

export const fetchSingleRestaurant = (id: string): Promise<ApiResponse<IRestaurant>> =>
      request<ApiResponse<IRestaurant>>(`${restaurantBaseUrl}/${id}`, {
            method: "GET",
      });
