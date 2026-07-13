import { storage } from "@/utils";

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const pendingRequests = new Map<string, Promise<unknown>>();

export function invalidateCache(pathPrefix: string): void {
      for (const key of cache.keys()) {
            if (key.includes(pathPrefix)) cache.delete(key);
      }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function request<T>(
      path: string,
      options: RequestInit & { cacheTtl?: number; timeout?: number } = {},
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
                  if (options.signal) {
                        if (options.signal.aborted) {
                              controller.abort();
                        } else {
                              options.signal.addEventListener("abort", () => controller.abort());
                        }
                  }
                  const timeoutLimit = options.timeout !== undefined ? options.timeout : 10000;
                  const timeoutId = setTimeout(() => controller.abort(), timeoutLimit);

                  const token = tokenOverride || storage.getToken();
                  const isFormData = options.body instanceof FormData;
                  const generatedId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

                  const headers: HeadersInit = {
                        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        "X-Request-ID": generatedId,
                        "X-Correlation-ID": generatedId,
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
                              const error = new Error(data?.message || data?.error || "Request failed") as Error & { status?: number };
                              error.status = res.status;

                              if (method === "GET" && res.status >= 500 && attempt < retries) {
                                    attempt++;
                                    await delay(Math.pow(2, attempt) * 300);
                                    continue;
                              }
                              throw error;
                        }

                        if (method === "GET") {
                              let ttl = options.cacheTtl;
                              if (ttl === undefined) {
                                    const lowerPath = path.toLowerCase();
                                    if (lowerPath.includes("/menu-items") || lowerPath.includes("/categories")) {
                                          ttl = 60000;
                                    } else if (lowerPath.includes("/restaurants")) {
                                          ttl = 30000;
                                    } else if (lowerPath.includes("/orders")) {
                                          ttl = 10000;
                                    } else {
                                          ttl = 3000;
                                    }
                              }
                              cache.set(cacheKey, {
                                    data,
                                    expiresAt: Date.now() + ttl,
                              });
                        }

                        return data as T;
                  } catch (err: unknown) {
                        clearTimeout(timeoutId);

                        const errorObject = err as Error & { message?: string };
                        const errMsg = (errorObject?.message ?? "").toLowerCase();
                        const isConnectionRefused =
                            errMsg.includes("failed to fetch") ||
                            errMsg.includes("networkerror") ||
                            errMsg.includes("load failed");

                        if (isConnectionRefused) {
                            throw err;
                        }

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