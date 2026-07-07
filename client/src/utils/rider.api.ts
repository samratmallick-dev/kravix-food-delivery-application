import { request } from "./request";
import { riderBaseUrl } from "../components/common/constant";
import type { ApiResponse, SuccessResponse } from "../types/api.types";
import type { IRider } from "../types/types";
import { compressImage } from "./compressImage";
import { uploadImage } from "./uploadImage";

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

export const addRiderProfile = async (payload: AddRiderProfilePayload): Promise<ApiResponse<IRider>> => {
      const compressed = await compressImage(payload.image);
      const pictureUrl = await uploadImage(compressed);

      return request<ApiResponse<IRider>>(`${riderBaseUrl}/`, {
            method: "POST",
            body: JSON.stringify({
                  phoneNumber: payload.phoneNumber,
                  aadhaarNumber: payload.aadhaarNumber,
                  drivingLicesce: payload.drivingLicesce,
                  latitude: payload.latitude,
                  longitude: payload.longitude,
                  pictureUrl,
            }),
      });
};

export const fetchMyRiderProfile = (): Promise<ApiResponse<IRider>> =>
      request<ApiResponse<IRider>>(`${riderBaseUrl}/me`, {
            method: "GET",
      });

export const updateRiderProfile = async (payload: UpdateRiderProfilePayload): Promise<ApiResponse<IRider>> => {
      const body: Record<string, string> = {};
      if (payload.phoneNumber) body.phoneNumber = payload.phoneNumber;
      if (payload.aadhaarNumber) body.aadhaarNumber = payload.aadhaarNumber;
      if (payload.drivingLicesce) body.drivingLicesce = payload.drivingLicesce;
      if (payload.image) {
            const compressed = await compressImage(payload.image);
            body.pictureUrl = await uploadImage(compressed);
      }

      return request<ApiResponse<IRider>>(`${riderBaseUrl}/me`, {
            method: "PATCH",
            body: JSON.stringify(body),
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
