import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";

const AI_MICROSERVICE_URL = process.env.AI_MICROSERVICE_URL || "http://0.0.0.0:5500";
const RESTAURANT_BASE_URL = process.env.RESTAURANT_BASE_URL || "http://localhost:9000";

const AI_REQUEST_TIMEOUT_MS = 35_000;
const CONTEXT_FETCH_TIMEOUT_MS = 4_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1_500;

class CircuitBreaker {
    private name: string;
    private failureThreshold: number;
    private recoveryMs: number;
    
    private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
    private failures = 0;
    private openUntil = 0;
    private probing = false;

    constructor(name: string, threshold = 5, recoveryMs = 30000) {
        this.name = name;
        this.failureThreshold = threshold;
        this.recoveryMs = recoveryMs;
    }

    public getState(): "CLOSED" | "OPEN" | "HALF_OPEN" {
        if (this.state === "OPEN") {
            if (Date.now() >= this.openUntil) {
                this.state = "HALF_OPEN";
                this.probing = false;
            }
        }
        return this.state;
    }

    public isOpen(): boolean {
        return this.getState() === "OPEN";
    }

    public shouldBlockConcurrently(): boolean {
        this.getState();
        if (this.state === "HALF_OPEN") {
            if (this.probing) {
                return true;
            }
            this.probing = true;
            return false;
        }
        return false;
    }

    public recordSuccess() {
        this.failures = 0;
        this.state = "CLOSED";
        this.openUntil = 0;
        this.probing = false;
        console.log(`[CircuitBreaker - ${this.name}] State transitioned to CLOSED`);
    }

    public recordFailure() {
        this.failures++;
        this.probing = false;
        if (this.failures >= this.failureThreshold) {
            this.state = "OPEN";
            this.openUntil = Date.now() + this.recoveryMs;
            console.error(JSON.stringify({
                level: "error", service: "utilities", component: "circuit_breaker",
                event: "circuit_open", name: this.name, failures: this.failures,
                recoveryAt: new Date(this.openUntil).toISOString(),
            }));
        }
    }
}

const CB = new CircuitBreaker("ai-service", 5, 30000);

interface WaitingRequest {
    resolve: () => void;
    reject: (err: any) => void;
    timestamp: number;
}

const coldStartQueue = {
    queue: [] as WaitingRequest[],
    isWaking: false,
    wakeStartedAt: 0,
    maxWakeTimeMs: 65_000,
    maxQueueSize: 50,
    pollInterval: null as any,

    async enqueue(): Promise<void> {
        if (this.queue.length >= this.maxQueueSize) {
            throw new Error("cold_start_queue_full");
        }
        return new Promise<void>((resolve, reject) => {
            this.queue.push({ resolve, reject, timestamp: Date.now() });
            this.startPolling();
        });
    },

    startPolling() {
        if (this.isWaking) return;
        this.isWaking = true;
        this.wakeStartedAt = Date.now();
        console.log("[ColdStart] Render service cold-start detected. Queueing requests and starting health poll...");

        this.pollInterval = setInterval(async () => {
            try {
                const res = await axios.get(`${AI_MICROSERVICE_URL}/ready`, { timeout: 3000 });
                if (res.status === 200 || res.status === 503) {
                    console.log("[ColdStart] Render service is awake!");
                    this.resolveAll();
                }
            } catch (err: any) {
                const elapsed = Date.now() - this.wakeStartedAt;
                if (elapsed > this.maxWakeTimeMs) {
                    console.error("[ColdStart] Render service failed to wake up within timeout.");
                    this.rejectAll(new Error("Render cold-start timeout"));
                } else {
                    console.log(`[ColdStart] Service still booting... (${Math.round(elapsed / 1000)}s elapsed)`);
                }
            }
        }, 5000);
    },

    resolveAll() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isWaking = false;
        const q = this.queue.splice(0);
        q.forEach(item => item.resolve());
    },

    rejectAll(err: any) {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isWaking = false;
        const q = this.queue.splice(0);
        q.forEach(item => item.reject(err));
    }
};

interface CouponCache {
    coupons: any[];
    timestamp: number;
}

let cachedCoupons: Record<string, CouponCache> = {};
const COUPON_CACHE_TTL_MS = 30_000;

async function getOrFetchCoupons(authToken: string, restaurantId: string | undefined): Promise<any[]> {
    const key = restaurantId || "global";
    const now = Date.now();
    
    if (cachedCoupons[key] && (now - cachedCoupons[key].timestamp < COUPON_CACHE_TTL_MS)) {
        return cachedCoupons[key].coupons;
    }

    try {
        const authHeaders = {
            Authorization: `Bearer ${authToken}`,
        };
        const couponsRes = await axios.get(`${RESTAURANT_BASE_URL}/api/v1/coupons`, {
            headers: authHeaders,
            params: restaurantId ? { restaurantId } : {},
            timeout: CONTEXT_FETCH_TIMEOUT_MS,
        });
        const rawCoupons = couponsRes.data?.data ?? [];
        const coupons = rawCoupons.slice(0, 5).map((c: any) => ({
            code: c.code,
            discountType: c.discountType,
            discountValue: c.discountValue,
            couponType: c.couponType,
            isActive: c.isActive,
        }));
        cachedCoupons[key] = { coupons, timestamp: now };
        return coupons;
    } catch (err: any) {
        console.warn("Failed to fetch coupons for context: ", err.message);
        return [];
    }
}

interface HealthStatus {
    healthy: boolean;
    redis: boolean;
    model: boolean;
    mongo: boolean;
    timestamp: number;
}

let cachedHealth: HealthStatus | null = null;
const HEALTH_CACHE_TTL_MS = 10_000;

async function getOrFetchHealth(): Promise<HealthStatus> {
    const now = Date.now();
    if (cachedHealth && (now - cachedHealth.timestamp < HEALTH_CACHE_TTL_MS)) {
        return cachedHealth;
    }

    try {
        const res = await axios.get(`${AI_MICROSERVICE_URL}/ready`, { timeout: 3000 });
        const data = res.data;
        const healthy = res.status === 200 && data.status === "ready";
        cachedHealth = {
            healthy,
            redis: data.redis ?? false,
            model: data.model_loaded ?? false,
            mongo: data.mongodb ?? false,
            timestamp: now,
        };
    } catch (err: any) {
        cachedHealth = {
            healthy: false,
            redis: false,
            model: false,
            mongo: false,
            timestamp: now,
        };
    }
    return cachedHealth;
}

function isRetryable(err: AxiosError): boolean {
    const code = err.code ?? "";
    const status = err.response?.status ?? 0;
    return (
        ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNABORTED"].includes(code) ||
        status === 502 || status === 503 || status === 504
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callAIWithRetry(
    payload: object,
    requestId: string,
    userId: string,
    role: string
): Promise<{ 
    reply: string; 
    intent: string;
    action: string;
    intent_confidence: number; 
    entities: any;
    followUp: string[];
    redis_latency_ms: number;
    inference_latency_ms: number;
    _latencyMs: number; 
    _retries: number;
}> {

    if (CB.isOpen()) {
        console.warn(JSON.stringify({
            level: "warn", service: "utilities", component: "circuit_breaker",
            event: "circuit_rejected", requestId, userId, role, state: CB.getState(),
        }));
        throw new Error("circuit_open");
    }

    if (CB.shouldBlockConcurrently()) {
        console.warn(JSON.stringify({
            level: "warn", service: "utilities", component: "circuit_breaker",
            event: "circuit_concurrent_blocked", requestId, userId, role, state: CB.getState(),
        }));
        throw new Error("circuit_concurrent_blocked");
    }

    let lastError: AxiosError | null = null;
    let totalRetries = 0;
    const overallStart = Date.now();

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const attemptStart = Date.now();
        try {
            const response = await axios.post(`${AI_MICROSERVICE_URL}/chat`, payload, {
                timeout: AI_REQUEST_TIMEOUT_MS,
                headers: { "X-Correlation-ID": requestId, "X-Request-ID": requestId },
            });
            const latencyMs = Date.now() - attemptStart;
            const totalMs = Date.now() - overallStart;

            CB.recordSuccess();

            console.log(JSON.stringify({
                level: "info", service: "utilities", component: "ai_client",
                event: "ai_request_success", requestId, userId, role,
                attempt, aiLatencyMs: latencyMs, totalMs, retries: totalRetries,
            }));

            return { ...response.data, _latencyMs: totalMs, _retries: totalRetries };
        } catch (err: any) {
            lastError = err as AxiosError;
            const latencyMs = Date.now() - attemptStart;
            const retryable = isRetryable(lastError);
            const status = lastError.response?.status ?? null;
            const errorCode = lastError.code ?? "UNKNOWN";

            console.error(JSON.stringify({
                level: "error", service: "utilities", component: "ai_client",
                event: "ai_request_failed", requestId, userId, role,
                attempt, latencyMs, errorCode, status,
                message: lastError.message,
                retrying: retryable && attempt < MAX_RETRIES,
            }));

            if (attempt === 0 && retryable) {
                coldStartQueue.startPolling();
                
                return {
                    reply: "Kravix AI is waking up. Please hold on for about 30 seconds... 🙏",
                    intent: "WAKING_UP",
                    action: "SHOW_WAKING_UP_SIGN",
                    intent_confidence: 1.0,
                    entities: {},
                    followUp: [],
                    redis_latency_ms: 0,
                    inference_latency_ms: 0,
                    _latencyMs: Date.now() - overallStart,
                    _retries: 0
                };
            }

            if (!retryable || attempt === MAX_RETRIES) {
                CB.recordFailure();
                break;
            }

            totalRetries++;
            // Exponential backoff + randomized jitter (+/- 0-1000ms)
            const backoffMs = RETRY_BASE_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 1000);
            await sleep(backoffMs);
        }
    }

    throw lastError;
}

async function fetchContextData(
    authToken: string,
    restaurantId: string | undefined,
    requestId: string,
    role: string
): Promise<{
    orders: { id: string; status: string }[];
    menu_items: { name: string; price: number; available: boolean }[];
    coupons: any[];
    _contextLatencyMs: number;
}> {
    const contextStart = Date.now();
    const contextData: {
        orders: { id: string; status: string }[];
        menu_items: { name: string; price: number; available: boolean }[];
        coupons: any[];
        _contextLatencyMs: number;
    } = { orders: [], menu_items: [], coupons: [], _contextLatencyMs: 0 };

    const authHeaders = {
        Authorization: `Bearer ${authToken}`,
        "X-Correlation-ID": requestId,
        "X-Request-ID": requestId,
    };

    // Code-level context boundaries based on user role
    if (role === "customer" || role === "admin") {
        try {
            const ordersRes = await axios.get(`${RESTAURANT_BASE_URL}/api/v1/orders/me`, {
                headers: authHeaders,
                params: { limit: 5 },
                timeout: CONTEXT_FETCH_TIMEOUT_MS,
            });
            const rawOrders = ordersRes.data?.data?.orders ?? ordersRes.data?.data ?? [];
            contextData.orders = rawOrders.map((o: any) => ({
                id: o._id ?? o.id,
                status: o.status,
            }));
        } catch {
            console.log("Failed to fetch user orders for AI context. Proceeding without order context.");
        }
    }

    if ((role === "customer" || role === "seller" || role === "admin") && restaurantId) {
        try {
            const menuRes = await axios.get(
                `${RESTAURANT_BASE_URL}/api/v1/menu/${restaurantId}`,
                { headers: authHeaders, timeout: CONTEXT_FETCH_TIMEOUT_MS }
            );
            const rawItems = menuRes.data?.data?.menuItems ?? menuRes.data?.data ?? [];
            contextData.menu_items = rawItems.slice(0, 10).map((item: any) => ({
                name: item.name,
                price: item.price,
                available: item.isAvailable ?? true,
            }));
        } catch {
            console.log("Failed to fetch restaurant menu for AI context. Proceeding without menu context.");
        }
    }

    if (role === "customer" || role === "seller" || role === "admin") {
        contextData.coupons = await getOrFetchCoupons(authToken, restaurantId);
    }

    contextData._contextLatencyMs = Date.now() - contextStart;
    return contextData;
}

export const aiChat = async (req: Request, res: Response) => {
    const requestId =
        (req.headers["x-request-id"] as string) ||
        (req.headers["x-correlation-id"] as string) ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser || !authUser._id) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = authUser._id;
    const role = authUser.role || "customer";
    const userName = authUser.name || "User";

    const { message, restaurantId, currentPage, currentModule, preferredLanguage, recentActions } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Missing required field: message" });
    }

    const requestStart = Date.now();
    const authToken = req.headers.authorization?.split(" ")[1] ?? "";

    if (coldStartQueue.isWaking) {
        return res.status(200).json({
            reply: "Kravix AI is waking up. Please hold on for about 30 seconds... 🙏",
            intent: "WAKING_UP",
            action: "SHOW_WAKING_UP_SIGN",
            intent_confidence: 1.0,
            entities: {},
            followUp: []
        });
    }

    const health = await getOrFetchHealth();
    console.log(JSON.stringify({
        level: "info", service: "utilities", component: "ai_controller",
        event: "health_consulted", requestId,
        aiServiceHealthy: health.healthy,
        redisHealthy: health.redis,
        modelReady: health.model,
        mongoHealthy: health.mongo
    }));

    const contextData = await fetchContextData(authToken, restaurantId, requestId, role);
    const contextLatencyMs = contextData._contextLatencyMs;

    const rolePermissions: Record<string, string[]> = {
        customer: ["read:profile", "create:order", "read:orders", "create:payment", "read:restaurants", "manage:cart"],
        seller: ["read:profile", "manage:menu", "manage:orders", "read:earnings", "manage:coupons", "read:restaurant_analytics"],
        rider: ["read:profile", "accept:deliveries", "update:delivery_status", "read:earnings", "manage:availability"],
        admin: ["read:profile", "manage:users", "manage:restaurants", "manage:riders", "read:platform_analytics", "manage:platform_settings"]
    };
    const permissions = rolePermissions[role] || rolePermissions.customer;

    const sanitizedContext = {
        orders: contextData.orders,
        menu_items: contextData.menu_items,
        coupons: contextData.coupons,
        userId: `user_${userId.slice(-6)}`,
        userRole: role,
        authenticated: true,
        userName,
        currentPage: currentPage || "/",
        currentModule: currentModule || "home",
        permissions,
        recentActions: recentActions || [],
        preferredLanguage: preferredLanguage || "en"
    };

    try {
        const { _latencyMs: aiLatencyMs, _retries: retries, ...data } =
            await callAIWithRetry({ message, userId, role, contextData: sanitizedContext }, requestId, userId, role);

        const totalMs = Date.now() - requestStart;
        console.log(JSON.stringify({
            level: "info", service: "utilities", component: "ai_controller",
            event: "chat_complete", requestId, correlationId: requestId, userId, role,
            contextLatencyMs, aiLatencyMs: data.redis_latency_ms + data.inference_latency_ms,
            redisLatencyMs: data.redis_latency_ms,
            inferenceLatencyMs: data.inference_latency_ms,
            totalMs, retries,
            circuitState: CB.getState(),
        }));

        res.setHeader("X-Request-ID", requestId);
        return res.status(200).json(data);
    } catch (error: any) {
        const totalMs = Date.now() - requestStart;
        const axiosErr = error as AxiosError;
        const status = axiosErr.response?.status ?? null;
        const errorCode = axiosErr.code ?? error.message ?? "UNKNOWN";
        const stack = error.stack ?? "";

        console.error(JSON.stringify({
            level: "error", service: "utilities", component: "ai_controller",
            event: "chat_failed", requestId, correlationId: requestId, userId, role,
            errorCode, status, totalMs,
            retriesExhausted: MAX_RETRIES,
            circuitState: CB.getState(),
            failureReason: error.message || "Request failed",
            exceptionStackTrace: stack
        }));

        res.setHeader("X-Request-ID", requestId);
        return res.status(200).json({
            reply: "I'm currently unavailable. Please try again in a moment.",
            intent: "UNKNOWN",
            action: "NONE",
            intent_confidence: 0,
            entities: {},
            followUp: []
        });
    }
};

export const aiFeedback = async (req: Request, res: Response) => {
    const requestId =
        (req.headers["x-request-id"] as string) ||
        (req.headers["x-correlation-id"] as string) ||
        `${Date.now()}`;
    try {
        const { messageId, message, reply, role, feedback } = req.body;
        if (!messageId || !message || !reply || !role || ![1, -1].includes(feedback)) {
            return res.status(400).json({ error: "Missing or invalid feedback fields" });
        }
        await axios.post(`${AI_MICROSERVICE_URL}/feedback`, { messageId, message, reply, role, feedback }, {
            timeout: 5_000,
            headers: { "X-Request-ID": requestId },
        });
        return res.status(204).send();
    } catch (error: any) {
        console.error(JSON.stringify({
            level: "warn", service: "utilities", component: "ai_client",
            event: "feedback_failed", requestId, message: error.message,
        }));
        return res.status(204).send();
    }
};
