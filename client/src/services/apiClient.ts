import { storage } from "@/utils";

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const pendingRequests = new Map<string, Promise<unknown>>();
const CACHE_PREFIX = "kravix_api_cache_";

function getSessionCache(key: string): { data: unknown; expiresAt: number } | null {
      try {
            const cached = sessionStorage.getItem(CACHE_PREFIX + key);
            if (!cached) return null;
            const parsed = JSON.parse(cached);
            if (typeof parsed === "object" && parsed !== null && "expiresAt" in parsed && "data" in parsed) {
                  return parsed as { data: unknown; expiresAt: number };
            }
      } catch (e) {
            console.error("Cache read error:", e);
      }
      return null;
}

function setSessionCache(key: string, data: unknown, expiresAt: number): void {
      try {
            sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, expiresAt }));
      } catch (e) {
            console.error("Cache write error:", e);
      }
}

export function invalidateCache(pathPrefix: string): void {
      for (const key of cache.keys()) {
            if (key.includes(pathPrefix)) cache.delete(key);
      }
      try {
            for (let i = 0; i < sessionStorage.length; i++) {
                  const key = sessionStorage.key(i);
                  if (key && key.startsWith(CACHE_PREFIX) && key.includes(pathPrefix)) {
                        sessionStorage.removeItem(key);
                  }
            }
      } catch (e) {
            console.error("Cache invalidation error:", e);
      }
}

export function prewarmServices(): void {
      if (import.meta.env.DEV) return;

      const baseUrls = [
            import.meta.env.VITE_API_URL_AUTH,
            import.meta.env.VITE_API_URL_RESTAURANT,
            import.meta.env.VITE_API_URL_PAYMENT,
            import.meta.env.VITE_API_URL_RIDER,
            import.meta.env.VITE_API_URL_ADMIN,
            import.meta.env.VITE_API_URL_ANALYTICS,
            import.meta.env.VITE_API_URL_REALTIME_SOCKET
      ];

      const uniqueHosts = new Set<string>();
      baseUrls.forEach(url => {
            try {
                  const urlObj = new URL(url);
                  uniqueHosts.add(`${urlObj.protocol}//${urlObj.host}`);
            } catch {
                  if (url.startsWith("http")) {
                        const match = url.match(/^(https?:\/\/[^\/]+)/);
                        if (match) uniqueHosts.add(match[1]);
                  }
            }
      });

      uniqueHosts.forEach(host => {
            fetch(`${host}/health`, { mode: "no-cors" }).catch(() => {});
            fetch(`${host}/`, { mode: "no-cors" }).catch(() => {});
      });
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
            const sessionCached = getSessionCache(cacheKey);
            if (sessionCached && sessionCached.expiresAt > Date.now()) {
                  cache.set(cacheKey, sessionCached);
                  return sessionCached.data as T;
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
                  const timeoutLimit = options.timeout !== undefined ? options.timeout : 30000;
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
                              const expiresAt = Date.now() + ttl;
                              cache.set(cacheKey, {
                                    data,
                                    expiresAt,
                              });
                              setSessionCache(cacheKey, data, expiresAt);
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