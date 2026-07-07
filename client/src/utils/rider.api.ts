import { request } from "./request";
import { riderBaseUrl } from "../components/common/constant";
import type { ApiResponse, SuccessResponse } from "../types/api.types";
import type { IRider } from "../types/types";

export interface AddRiderProfilePayload {
      phoneNumber: string;
      aadhaarNumber: string;
      drivingLicesce: string;
      latitude: number;
      longitude: number;
      image: File;
}

export interface UpdateRiderProfilePayload {
      phoneNumber?: string;
      aadhaarNumber?: string;
      drivingLicesce?: string;
      image?: File;
}

export interface ToggleRiderAvailabilityPayload {
      isAvailable: boolean;
      latitude: number;
      longitude: number;
}

export interface UpdateLiveLocationPayload {
      latitude: number;
      longitude: number;
      orderId: string;
      customerUserId: string;
}

export interface RiderEarningsResponse {
      totalEarnings: number;
      totalDeliveries: number;
      rating: number | null;
      todayEarnings: number;
      weekEarnings: number;
      weeklyBreakdown: { date: string; amount: number }[];
}

export const addRiderProfile = (payload: AddRiderProfilePayload): Promise<ApiResponse<IRider>> => {
      const formData = new FormData();
      formData.append("phoneNumber", payload.phoneNumber);
      formData.append("aadhaarNumber", payload.aadhaarNumber);
      formData.append("drivingLicesce", payload.drivingLicesce);
      formData.append("latitude", payload.latitude.toString());
      formData.append("longitude", payload.longitude.toString());
      formData.append("image", payload.image);

      return request<ApiResponse<IRider>>(`${riderBaseUrl}/`, {
            method: "POST",
            body: formData,
      });
};

export const fetchMyRiderProfile = (): Promise<ApiResponse<IRider>> =>
      request<ApiResponse<IRider>>(`${riderBaseUrl}/me`, {
            method: "GET",
      });

export const updateRiderProfile = (payload: UpdateRiderProfilePayload): Promise<ApiResponse<IRider>> => {
      const formData = new FormData();
      if (payload.phoneNumber) formData.append("phoneNumber", payload.phoneNumber);
      if (payload.aadhaarNumber) formData.append("aadhaarNumber", payload.aadhaarNumber);
      if (payload.drivingLicesce) formData.append("drivingLicesce", payload.drivingLicesce);
      if (payload.image) formData.append("image", payload.image);

      return request<ApiResponse<IRider>>(`${riderBaseUrl}/me`, {
            method: "PATCH",
            body: formData,
      });
};

export const toggleRiderAvailability = (payload: ToggleRiderAvailabilityPayload): Promise<ApiResponse<IRider>> =>
      request<ApiResponse<IRider>>(`${riderBaseUrl}/me/availability`, {
            method: "PATCH",
            body: JSON.stringify(payload),
      });

export const updateLiveLocation = (payload: UpdateLiveLocationPayload): Promise<SuccessResponse> =>
      request<SuccessResponse>(`${riderBaseUrl}/me/location`, {
            method: "PATCH",
            body: JSON.stringify(payload),
      });

export const fetchEarnings = (): Promise<ApiResponse<RiderEarningsResponse>> =>
      request<ApiResponse<RiderEarningsResponse>>(`${riderBaseUrl}/me/earnings`, {
            method: "GET",
      });

export const fetchCurrentOrder = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/orders/current`, {
            method: "GET",
      });

export const updateOrderStatusByRider = (orderId: string, latitude?: number, longitude?: number, otp?: string, codPaymentMode?: string): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/orders/status`, {
            method: "PATCH",
            body: JSON.stringify({ orderId, latitude, longitude, otp, codPaymentMode }),
      });

export const fetchDeliveryHistory = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/orders/delivery-history`, {
            method: "GET",
      });

export const acceptOrder = (orderId: string): Promise<ApiResponse<IRider>> =>
      request<ApiResponse<IRider>>(`${riderBaseUrl}/orders/${orderId}/accept`, {
            method: "POST",
      });

export const generateDeliveryOtp = (orderId: string): Promise<SuccessResponse> =>
      request<SuccessResponse>(`${riderBaseUrl}/orders/otp/generate`, {
            method: "POST",
            body: JSON.stringify({ orderId }),
      });
