import { storage } from "./secureStorage";

export async function request<T>(
    path: string,
    options: RequestInit = {},
    tokenOverride?: string
): Promise<T> {
    const token = tokenOverride || storage.getToken();
    const isFormData = options.body instanceof FormData;

    const headers: HeadersInit = {
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const res = await fetch(path, {
        ...options,
        headers,
    });

    const data = await res.json().catch(() => ({ message: "Failed to parse response" }));

    if (!res.ok) {
        const error = new Error(data?.message || data?.error || "Request failed") as any;
        error.status = res.status;
        throw error;
    }

    return data as T;
}
