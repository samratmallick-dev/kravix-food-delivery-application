import { storage } from "./secureStorage";

const cache = new Map<string, { data: any; expiresAt: number }>();
const pendingRequests = new Map<string, Promise<any>>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function request<T>(
    path: string,
    options: RequestInit = {},
    tokenOverride?: string
): Promise<T> {
    const method = options.method || "GET";
    const cacheKey = `${method}:${path}:${options.body ? JSON.stringify(options.body) : ""}`;

    if (method === "GET") {
        const cached = cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data as T;
        }
    }

    if (method === "GET") {
        const pending = pendingRequests.get(cacheKey);
        if (pending) {
            return pending as Promise<T>;
        }
    }

    const executeRequest = async (): Promise<T> => {
        const retries = 2;
        let attempt = 0;

        while (attempt <= retries) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); 

            const token = tokenOverride || storage.getToken();
            const isFormData = options.body instanceof FormData;

            const headers: HeadersInit = {
                ...(!isFormData ? { "Content-Type": "application/json" } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(options.headers || {}),
            };

            try {
                const res = await fetch(path, {
                    ...options,
                    headers,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                const data = await res.json().catch(() => ({ message: "Failed to parse response" }));

                if (!res.ok) {
                    const error = new Error(data?.message || data?.error || "Request failed") as any;
                    error.status = res.status;
                    
                    if (method === "GET" && res.status >= 500 && attempt < retries) {
                        attempt++;
                        await delay(Math.pow(2, attempt) * 300);
                        continue;
                    }
                    throw error;
                }

                if (method === "GET") {
                    cache.set(cacheKey, {
                        data,
                        expiresAt: Date.now() + 3000,
                    });
                }

                return data as T;
            } catch (err: any) {
                clearTimeout(timeoutId);
                
                if (method === "GET" && attempt < retries) {
                    attempt++;
                    await delay(Math.pow(2, attempt) * 300);
                    continue;
                }
                throw err;
            }
        }
        throw new Error("Request failed after retries");
    };

    if (method === "GET") {
        const requestPromise = executeRequest().finally(() => {
            pendingRequests.delete(cacheKey);
        });
        pendingRequests.set(cacheKey, requestPromise);
        return requestPromise;
    }

    return executeRequest();
}
