import { authBaseUrl } from "../components/common/constant";

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${authBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = (await res.json()) as T & { message?: string };
  if (!res.ok) throw new Error((data as { message?: string }).message ?? "Request failed");
  return data;
}

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

export const registerWithEmail = (payload: RegisterPayload): Promise<MessageResponse> =>
  request<MessageResponse>("/register", { method: "POST", body: JSON.stringify(payload) });

export const loginWithEmail = (payload: LoginPayload): Promise<LoginResponse> =>
  request<LoginResponse>("/login", { method: "POST", body: JSON.stringify(payload) });

export const verifyEmail = (token: string): Promise<MessageResponse> =>
  request<MessageResponse>(`/verify-email?token=${encodeURIComponent(token)}`, { method: "GET" });

export const resendVerificationEmail = (email: string): Promise<MessageResponse> =>
  request<MessageResponse>("/resend-verification", { method: "POST", body: JSON.stringify({ email }) });

export const forgotPassword = (email: string): Promise<MessageResponse> =>
  request<MessageResponse>("/forgot-password", { method: "POST", body: JSON.stringify({ email }) });

export const resetPassword = (payload: {
  token: string;
  newPassword: string;
}): Promise<MessageResponse> =>
  request<MessageResponse>("/reset-password", { method: "POST", body: JSON.stringify(payload) });
