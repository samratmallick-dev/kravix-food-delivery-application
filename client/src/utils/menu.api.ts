import { request } from "./request";
import { menuBaseUrl } from "../components/common/constant";
import { buildQueryString } from "./query";
import type { ApiResponse, SuccessResponse } from "../types/api.types";
import type { IMenuItem, IFoodSearchResult } from "../types/types";

export interface AddMenuItemPayload {
      name: string;
      description?: string;
      price: string | number;
      image: File;
      isVeg: boolean;
      category: string;
}

export interface UpdateMenuItemPayload {
      name: string;
      description?: string;
      price: string | number;
      image?: File;
      isVeg: boolean;
      category: string;
}

export interface AutocompleteParams {
      q?: string;
      latitude: number;
      longitude: number;
      radius?: number;
}

export interface AutocompleteSuggestion {
      id: string;
      name: string;
      image: string;
      type: "Restaurant" | "Dish";
      restaurantId?: string;
}

export interface SearchFoodParams {
      search?: string;
      latitude: number;
      longitude: number;
      radius?: number;
}

export const addMenuItem = (payload: AddMenuItemPayload): Promise<ApiResponse<IMenuItem>> => {
      const formData = new FormData();
      formData.append("name", payload.name);
      if (payload.description) formData.append("description", payload.description);
      formData.append("price", payload.price.toString());
      formData.append("image", payload.image);
      formData.append("isVeg", payload.isVeg.toString());
      formData.append("category", payload.category);

      return request<ApiResponse<IMenuItem>>(`${menuBaseUrl}/`, {
            method: "POST",
            body: formData,
      });
};

export const autocompleteMenu = (params: AutocompleteParams, options?: RequestInit): Promise<ApiResponse<AutocompleteSuggestion[]>> => {
      const qs = buildQueryString(params as any);
      return request<ApiResponse<AutocompleteSuggestion[]>>(`${menuBaseUrl}/autocomplete${qs}`, {
            method: "GET",
            ...options,
      });
};

export const searchByFood = (params: SearchFoodParams): Promise<ApiResponse<IFoodSearchResult[]> & { correctedQuery?: string }> => {
      const qs = buildQueryString(params as any);
      return request<ApiResponse<IFoodSearchResult[]> & { correctedQuery?: string }>(`${menuBaseUrl}/search${qs}`, {
            method: "GET",
      });
};

export const getAllMenuItems = (restaurantId: string): Promise<ApiResponse<IMenuItem[]>> =>
      request<ApiResponse<IMenuItem[]>>(`${menuBaseUrl}/${restaurantId}`, {
            method: "GET",
      });

export const deleteMenuItem = (itemId: string): Promise<SuccessResponse> =>
      request<SuccessResponse>(`${menuBaseUrl}/${itemId}`, {
            method: "DELETE",
      });

export const toggleMenuItemAvailability = (itemId: string): Promise<ApiResponse<IMenuItem>> =>
      request<ApiResponse<IMenuItem>>(`${menuBaseUrl}/${itemId}/availability`, {
            method: "PATCH",
      });

export const updateMenuItem = (itemId: string, payload: UpdateMenuItemPayload): Promise<ApiResponse<IMenuItem>> => {
      const formData = new FormData();
      formData.append("name", payload.name);
      if (payload.description) formData.append("description", payload.description);
      formData.append("price", payload.price.toString());
      if (payload.image) formData.append("image", payload.image);
      formData.append("isVeg", payload.isVeg.toString());
      formData.append("category", payload.category);

      return request<ApiResponse<IMenuItem>>(`${menuBaseUrl}/${itemId}`, {
            method: "PUT",
            body: formData,
      });
};

export interface ICategory {
      name: string;
      count: number;
      image: string;
}

export const getAvailableCategories = (): Promise<ApiResponse<ICategory[]>> =>
      request<ApiResponse<ICategory[]>>(`${menuBaseUrl}/categories`, {
            method: "GET",
      });
