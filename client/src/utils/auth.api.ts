import { authBaseUrl } from "../components/common/constant";

import { request } from "./request";
import type { User } from "../types/types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  needsRoleSelection?: boolean;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string | null;
    isEmailVerified: boolean;
    authProvider: "google" | "email";
    profileImage: string;
  };
  message?: string;
}

export interface MessageResponse {
  message: string;
}

export interface UpdateProfilePayload {
  name?: string;
  image?: string;
}

export interface UpdateProfileResponse {
  token: string;
  data: {
    _id: string;
    name: string;
    email: string;
    image: string;
    role: string | null;
  };
}

export const updateProfile = (payload: UpdateProfilePayload, token?: string): Promise<UpdateProfileResponse> =>
  request<UpdateProfileResponse>(`${authBaseUrl}/me`, { method: "PATCH", body: JSON.stringify(payload) }, token);

export const getMyProfile = (token?: string): Promise<{ data: User }> =>
  request<{ data: User }>(`${authBaseUrl}/me`, { method: "GET" }, token);

export const registerWithEmail = (payload: RegisterPayload): Promise<MessageResponse> =>
  request<MessageResponse>(`${authBaseUrl}/register`, { method: "POST", body: JSON.stringify(payload) });

export const loginWithEmail = (payload: LoginPayload): Promise<LoginResponse> =>
  request<LoginResponse>(`${authBaseUrl}/login`, { method: "POST", body: JSON.stringify(payload) });

export const verifyEmail = (token: string): Promise<MessageResponse> =>
  request<MessageResponse>(`${authBaseUrl}/verify-email?token=${encodeURIComponent(token)}`, { method: "GET" });

export const resendVerificationEmail = (email: string): Promise<MessageResponse> =>
  request<MessageResponse>(`${authBaseUrl}/resend-verification`, { method: "POST", body: JSON.stringify({ email }) });

export const forgotPassword = (email: string): Promise<MessageResponse> =>
  request<MessageResponse>(`${authBaseUrl}/forgot-password`, { method: "POST", body: JSON.stringify({ email }) });

export const resetPassword = (payload: {
  token: string;
  newPassword: string;
}): Promise<MessageResponse> =>
  request<MessageResponse>(`${authBaseUrl}/reset-password`, { method: "POST", body: JSON.stringify(payload) });

export const updateRole = (role: string): Promise<UpdateProfileResponse> =>
  request<UpdateProfileResponse>(`${authBaseUrl}/me/role`, { method: "PATCH", body: JSON.stringify({ role }) });

export const loginWithGoogle = (code: string): Promise<LoginResponse> =>
  request<LoginResponse>(`${authBaseUrl}/sessions`, { method: "POST", body: JSON.stringify({ code }) });
