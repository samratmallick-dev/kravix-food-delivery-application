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
      address?: string;
      emergencyContact?: {
            name: string;
            phone: string;
            relation: string;
      };
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
      walletBalance?: number;
      codCollection?: number;
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
      const body: Record<string, any> = {};
      if (payload.phoneNumber) body.phoneNumber = payload.phoneNumber;
      if (payload.aadhaarNumber) body.aadhaarNumber = payload.aadhaarNumber;
      if (payload.drivingLicesce) body.drivingLicesce = payload.drivingLicesce;
      if (payload.address) body.address = payload.address;
      if (payload.emergencyContact) body.emergencyContact = payload.emergencyContact;
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
      request<ApiResponse<any>>(`${riderBaseUrl}/orders/${orderId}/status`, {
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
      request<SuccessResponse>(`${riderBaseUrl}/orders/${orderId}/otp/generate`, {
            method: "POST",
            body: JSON.stringify({ orderId }),
      });

export const startShift = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/shift/start`, { method: "POST" });

export const endShift = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/shift/end`, { method: "POST" });

export const pauseShift = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/shift/pause`, { method: "POST" });

export const resumeShift = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/shift/resume`, { method: "POST" });

export const fetchShiftHistory = (): Promise<ApiResponse<any[]>> =>
      request<ApiResponse<any[]>>(`${riderBaseUrl}/shift/history`, { method: "GET" });

export const fetchVehicle = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/vehicle`, { method: "GET" });

export const updateVehicle = (payload: any): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/vehicle`, {
            method: "PATCH",
            body: JSON.stringify(payload),
      });

export const fetchWalletSummary = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/wallet/summary`, { method: "GET" });

export const fetchWalletTransactions = (): Promise<ApiResponse<any[]>> =>
      request<ApiResponse<any[]>>(`${riderBaseUrl}/wallet/transactions`, { method: "GET" });

export const fetchWalletSettlements = (): Promise<ApiResponse<any[]>> =>
      request<ApiResponse<any[]>>(`${riderBaseUrl}/wallet/settlements`, { method: "GET" });

export const withdrawFunds = (amount: number): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/wallet/withdraw`, {
            method: "POST",
            body: JSON.stringify({ amount }),
      });

export const configureBankDetails = (payload: any): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/wallet/bank`, {
            method: "POST",
            body: JSON.stringify(payload),
      });

export const fetchDocuments = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/documents`, { method: "GET" });

export const uploadRiderDocument = async (field: "dl" | "aadhaar" | "photo", file: File): Promise<ApiResponse<any>> => {
      const compressed = await compressImage(file);
      const url = await uploadImage(compressed);
      
      const body: Record<string, string> = {};
      if (field === "dl") body.drivingLicenseUrl = url;
      if (field === "aadhaar") body.aadhaarUrl = url;
      if (field === "photo") body.pictureUrl = url;

      return request<ApiResponse<any>>(`${riderBaseUrl}/documents/upload`, {
            method: "POST",
            body: JSON.stringify(body),
      });
};

export const fetchNotifications = (): Promise<ApiResponse<any[]>> =>
      request<ApiResponse<any[]>>(`${riderBaseUrl}/notifications`, { method: "GET" });

export const markNotificationRead = (id: string): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = (): Promise<SuccessResponse> =>
      request<SuccessResponse>(`${riderBaseUrl}/notifications/read`, { method: "PATCH" });

export const fetchPerformance = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/performance`, { method: "GET" });

export const fetchLeaderboard = (): Promise<ApiResponse<any[]>> =>
      request<ApiResponse<any[]>>(`${riderBaseUrl}/leaderboard`, { method: "GET" });

export const fetchAnalytics = (): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${riderBaseUrl}/analytics`, { method: "GET" });
