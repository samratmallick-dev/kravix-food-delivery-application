import { request } from "./request";
import { addressBaseUrl } from "../components/common/constant";
import type { ApiResponse } from "../types/api.types";

export interface AddAddressPayload {
      mobile: number | string;
      formattedAddress: string;
      latitude: number;
      longitude: number;
}

export interface AddressResponse {
      _id: string;
      mobile: number;
      formatedAddress: string;
      latitude: number;
      longitude: number;
}

export const addAddress = (payload: AddAddressPayload): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${addressBaseUrl}/`, {
            method: "POST",
            body: JSON.stringify(payload),
      });

export const getMyAddresses = (): Promise<ApiResponse<AddressResponse[]>> =>
      request<ApiResponse<AddressResponse[]>>(`${addressBaseUrl}/`, {
            method: "GET",
      });

export const deleteAddress = (addressId: string): Promise<ApiResponse<any>> =>
      request<ApiResponse<any>>(`${addressBaseUrl}/${addressId}`, {
            method: "DELETE",
      });
