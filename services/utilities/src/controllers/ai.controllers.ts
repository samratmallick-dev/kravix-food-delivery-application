import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import http from "http";
import https from "https";
import { AuthenticatedRequest } from "../middleware/isAuthenticated.js";

const AI_MICROSERVICE_URL = (process.env.AI_MICROSERVICE_URL || "http://localhost:5500").replace(/\/$/, "");
const RESTAURANT_BASE_URL = (process.env.RESTAURANT_BASE_URL || "http://localhost:9000").replace(/\/$/, "");

const AI_REQUEST_TIMEOUT_MS   = 35_000;
const CONTEXT_FETCH_TIMEOUT_MS = 4_000;
const HEALTH_CHECK_TIMEOUT_MS  = 4_000;
const MAX_RETRIES              = 2;
const RETRY_BASE_MS            = 1_000;
const HEALTH_CACHE_TTL_MS      = 8_000;
const COUPON_CACHE_TTL_MS      = 30_000;
const COLD_START_MAX_WAIT_MS   = 70_000;
const COLD_START_POLL_MS       = 4_000;
const COLD_START_QUEUE_MAX     = 40;

const httpAgent  = new http.Agent ({ keepAlive: true, maxSockets: 20, timeout: AI_REQUEST_TIMEOUT_MS + 5_000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20, timeout: AI_REQUEST_TIMEOUT_MS + 5_000 });

const aiAxios = axios.create({
    baseURL: AI_MICROSERVICE_URL,
    httpAgent,
    httpsAgent,
    timeout: AI_REQUEST_TIMEOUT_MS,
});

const ctxAxios = axios.create({
    baseURL: RESTAURANT_BASE_URL,
    httpAgent: new http.Agent({ keepAlive: true, maxSockets: 10 }),
    httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 10 }),
    timeout: CONTEXT_FETCH_TIMEOUT_MS,
});

function log(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown>) {
    const entry = JSON.stringify({ level, service: "utilities", component: "ai", event, ts: new Date().toISOString(), ...fields });
    if (level === "error") console.error(entry);
    else if (level === "warn")  console.warn(entry);
    else                        console.log(entry);
}

class CircuitBreaker {
    private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
    private failures = 0;
    private openUntil = 0;
    private halfOpenProbeInFlight = false;

    constructor(
        private readonly name: string,
        private readonly threshold = 5,
        private readonly recoveryMs = 30_000,
    ) {}

    getState(): "CLOSED" | "OPEN" | "HALF_OPEN" {
        if (this.state === "OPEN" && Date.now() >= this.openUntil) {
            this.state = "HALF_OPEN";
            this.halfOpenProbeInFlight = false;
            log("info", "circuit_half_open", { name: this.name });
        }
        return this.state;
    }

    shouldBlock(): boolean {
        const s = this.getState();
        if (s === "CLOSED") return false;
        if (s === "OPEN")   return true;
        if (this.halfOpenProbeInFlight) return true;
        this.halfOpenProbeInFlight = true;
        return false;
    }

    recordSuccess() {
        this.failures = 0;
        this.state = "CLOSED";
        this.openUntil = 0;
        this.halfOpenProbeInFlight = false;
        log("info", "circuit_closed", { name: this.name });
        cachedHealth = null;
    }

    recordFailure(context: string) {
        this.halfOpenProbeInFlight = false;
        this.failures++;
        if (this.failures >= this.threshold || this.state === "HALF_OPEN") {
            this.state = "OPEN";
            this.openUntil = Date.now() + this.recoveryMs;
            log("error", "circuit_open", {
                name: this.name, failures: this.failures, context,
                recoveryAt: new Date(this.openUntil).toISOString(),
            });
        }
    }

    isOpen()     { return this.getState() === "OPEN"; }
    isHalfOpen() { return this.getState() === "HALF_OPEN"; }
}

const CB = new CircuitBreaker("ai-service", 5, 30_000);

interface Waiter { resolve: () => void; reject: (e: Error) => void; ts: number }

const coldStart = {
    queue:        [] as Waiter[],
    waking:       false,
    startedAt:    0,
    pollTimer:    null as ReturnType<typeof setInterval> | null,

    wait(): Promise<void> {
        if (this.queue.length >= COLD_START_QUEUE_MAX) {
            return Promise.reject(new Error("cold_start_queue_full"));
        }
        return new Promise<void>((resolve, reject) => {
            this.queue.push({ resolve, reject, ts: Date.now() });
            this._startPolling();
        });
    },

    _startPolling() {
        if (this.pollTimer) return;
        this.waking    = true;
        this.startedAt = Date.now();
        log("info", "cold_start_detected", { queueSize: this.queue.length });

        this.pollTimer = setInterval(async () => {
            try {
                const res = await aiAxios.get("/ready", { timeout: 3_000 });
                if (res.status === 200 || res.status === 503) {
                    log("info", "cold_start_resolved", { elapsed: Date.now() - this.startedAt });
                    this._resolveAll();
                }
            } catch {
                const elapsed = Date.now() - this.startedAt;
                if (elapsed > COLD_START_MAX_WAIT_MS) {
                    log("error", "cold_start_timeout", { elapsed });
                    this._rejectAll(new Error("cold_start_timeout"));
                } else {
                    log("info", "cold_start_polling", { elapsed: Math.round(elapsed / 1000) + "s" });
                }
            }
        }, COLD_START_POLL_MS);
    },

    _resolveAll() {
        this._clear();
        this.queue.splice(0).forEach(w => w.resolve());
    },

    _rejectAll(err: Error) {
        this._clear();
        this.queue.splice(0).forEach(w => w.reject(err));
    },

    _clear() {
        if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
        this.waking = false;
    },
};

interface HealthStatus { healthy: boolean; redis: boolean; model: boolean; mongo: boolean; ts: number }
let cachedHealth: HealthStatus | null = null;

async function fetchHealth(requestId: string): Promise<HealthStatus> {
    const now = Date.now();
    if (cachedHealth && now - cachedHealth.ts < HEALTH_CACHE_TTL_MS) return cachedHealth;

    try {
        const res = await aiAxios.get("/ready", { timeout: HEALTH_CHECK_TIMEOUT_MS });
        const d = res.data ?? {};
        cachedHealth = {
            healthy: res.status === 200 && d.status === "ready",
            redis:   d.redis         ?? false,
            model:   d.model_loaded  ?? false,
            mongo:   d.mongodb       ?? false,
            ts:      now,
        };
        log("info", "health_ok", { requestId, ...cachedHealth });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        log("warn", "health_check_failed", { requestId, reason: msg });
        cachedHealth = { healthy: false, redis: false, model: false, mongo: false, ts: now };
    }
    return cachedHealth;
}

function isRetryable(err: AxiosError): boolean {
    const code   = err.code ?? "";
    const status = err.response?.status ?? 0;
    return (
        ["ECONNREFUSED","ECONNRESET","ETIMEDOUT","ENOTFOUND","EAI_AGAIN","ECONNABORTED","EPIPE"].includes(code) ||
        status === 429 || status === 502 || status === 503 || status === 504
    );
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

interface AIResult {
    reply: string; intent: string; action: string;
    intent_confidence: number; entities: unknown; followUp: string[];
    redis_latency_ms: number; inference_latency_ms: number;
    _latencyMs: number; _retries: number;
}

async function callAI(payload: object, requestId: string, userId: string, role: string): Promise<AIResult> {
    if (CB.shouldBlock()) {
        const state = CB.getState();
        log("warn", "circuit_blocked", { requestId, userId, role, state });

        if (state === "OPEN") {
            await coldStart.wait();
        } else {
            throw Object.assign(new Error("circuit_open"), { code: "CIRCUIT_OPEN" });
        }
    }

    let lastErr: AxiosError | null = null;
    let retries = 0;
    const t0 = Date.now();

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const tAttempt = Date.now();
        try {
            const res = await aiAxios.post("/chat", payload, {
                headers: { "X-Correlation-ID": requestId, "X-Request-ID": requestId },
            });

            CB.recordSuccess();
            log("info", "ai_call_success", {
                requestId, userId, role, attempt, retries,
                latencyMs: Date.now() - tAttempt, totalMs: Date.now() - t0,
            });
            return { ...res.data, _latencyMs: Date.now() - t0, _retries: retries };

        } catch (err: unknown) {
            lastErr = err as AxiosError;
            const code   = lastErr.code ?? "UNKNOWN";
            const status = lastErr.response?.status ?? null;
            const retryable = isRetryable(lastErr);

            log("error", "ai_call_failed", {
                requestId, userId, role, attempt, retries,
                code, status, retryable,
                message: lastErr.message,
                latencyMs: Date.now() - tAttempt,
                stack: lastErr.stack?.split("\n").slice(0, 4).join(" | "),
            });

            if (attempt === 0 && retryable && (code === "ECONNREFUSED" || status === 503 || status === 502)) {
                log("info", "cold_start_wait_start", { requestId });
                try {
                    await coldStart.wait();
                    log("info", "cold_start_wait_done", { requestId });
                    continue;
                } catch (csErr: unknown) {
                    CB.recordFailure("cold_start_timeout");
                    throw csErr;
                }
            }

            if (!retryable || attempt === MAX_RETRIES) {
                CB.recordFailure(`${code ?? status}`);
                break;
            }

            retries++;
            const backoff = RETRY_BASE_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 800);
            log("info", "ai_call_retry", { requestId, attempt, backoffMs: backoff });
            await sleep(backoff);
        }
    }

    throw lastErr ?? new Error("ai_call_exhausted");
}

interface ContextData {
    orders:     { id: string; status: string }[];
    menu_items: { name: string; price: number; available: boolean }[];
    coupons:    unknown[];
    _ms:        number;
}

let couponCache: Record<string, { data: unknown[]; ts: number }> = {};

async function fetchContext(token: string, restaurantId: string | undefined, requestId: string, role: string): Promise<ContextData> {
    const t0 = Date.now();
    const headers = { Authorization: `Bearer ${token}`, "X-Correlation-ID": requestId };
    const ctx: ContextData = { orders: [], menu_items: [], coupons: [], _ms: 0 };

    if (role === "customer" || role === "admin") {
        try {
            const r = await ctxAxios.get("/api/v1/orders/me", { headers, params: { limit: 5 } });
            const raw = r.data?.data?.orders ?? r.data?.data ?? [];
            ctx.orders = raw.map((o: { _id?: string; id?: string; status: string }) => ({ id: o._id ?? o.id, status: o.status }));
        } catch (e: unknown) {
            log("warn", "ctx_orders_failed", { requestId, reason: (e as Error).message });
        }
    }

    if (restaurantId && (role === "customer" || role === "seller" || role === "admin")) {
        try {
            const r = await ctxAxios.get(`/api/v1/menu/${restaurantId}`, { headers });
            const raw = r.data?.data?.menuItems ?? r.data?.data ?? [];
            ctx.menu_items = raw.slice(0, 10).map((i: { name: string; price: number; isAvailable?: boolean }) => ({
                name: i.name, price: i.price, available: i.isAvailable ?? true,
            }));
        } catch (e: unknown) {
            log("warn", "ctx_menu_failed", { requestId, reason: (e as Error).message });
        }
    }

    if (role === "customer" || role === "seller" || role === "admin") {
        const key = restaurantId ?? "global";
        const now = Date.now();
        if (couponCache[key] && now - couponCache[key].ts < COUPON_CACHE_TTL_MS) {
            ctx.coupons = couponCache[key].data;
        } else {
            try {
                const r = await ctxAxios.get("/api/v1/coupons", {
                    headers, params: restaurantId ? { restaurantId } : {},
                });
                const raw = (r.data?.data ?? []).slice(0, 5).map((c: { code: string; discountType: string; discountValue: number; couponType: string; isActive: boolean }) => ({
                    code: c.code, discountType: c.discountType,
                    discountValue: c.discountValue, couponType: c.couponType, isActive: c.isActive,
                }));
                couponCache[key] = { data: raw, ts: now };
                ctx.coupons = raw;
            } catch (e: unknown) {
                log("warn", "ctx_coupons_failed", { requestId, reason: (e as Error).message });
            }
        }
    }

    ctx._ms = Date.now() - t0;
    return ctx;
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
    customer: ["read:profile","create:order","read:orders","create:payment","read:restaurants","manage:cart"],
    seller:   ["read:profile","manage:menu","manage:orders","read:earnings","manage:coupons","read:restaurant_analytics"],
    rider:    ["read:profile","accept:deliveries","update:delivery_status","read:earnings","manage:availability"],
    admin:    ["read:profile","manage:users","manage:restaurants","manage:riders","read:platform_analytics","manage:platform_settings"],
};

export const aiChat = async (req: Request, res: Response) => {
    const requestId =
        (req.headers["x-request-id"] as string) ||
        (req.headers["x-correlation-id"] as string) ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const authUser = (req as AuthenticatedRequest).user;
    if (!authUser?._id) return res.status(401).json({ error: "Unauthorized" });

    const userId   = authUser._id as string;
    const role     = (authUser.role as string) || "customer";
    const userName = (authUser.name as string) || "User";
    const { message, restaurantId, currentPage, currentModule, preferredLanguage, recentActions } = req.body as {
        message: string; restaurantId?: string; currentPage?: string;
        currentModule?: string; preferredLanguage?: string; recentActions?: string[];
    };

    if (!message) return res.status(400).json({ error: "Missing required field: message" });

    const t0    = Date.now();
    const token = (req.headers.authorization ?? "").replace("Bearer ", "");

    res.setHeader("X-Request-ID", requestId);

    if (coldStart.waking) {
        return res.status(200).json({
            reply: "Kravix AI is waking up — please hold on for about 30 seconds 🙏",
            intent: "WAKING_UP", action: "SHOW_WAKING_UP_SIGN",
            intent_confidence: 1.0, entities: {}, followUp: [],
        });
    }

    const health = await fetchHealth(requestId);
    log("info", "health_consulted", {
        requestId, userId, role,
        healthy: health.healthy, redis: health.redis, model: health.model,
    });

    const ctx = await fetchContext(token, restaurantId, requestId, role);

    const sanitizedCtx = {
        orders:            ctx.orders,
        menu_items:        ctx.menu_items,
        coupons:           ctx.coupons,
        userId:            `user_${userId.slice(-6)}`,
        userRole:          role,
        authenticated:     true,
        userName,
        currentPage:       currentPage  || "/",
        currentModule:     currentModule || "home",
        permissions:       ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS["customer"],
        recentActions:     recentActions || [],
        preferredLanguage: preferredLanguage || "en",
    };

    try {
        const { _latencyMs, _retries, ...data } = await callAI(
            { message, userId, role, contextData: sanitizedCtx },
            requestId, userId, role,
        );

        log("info", "chat_complete", {
            requestId, userId, role,
            contextMs: ctx._ms, aiMs: _latencyMs, totalMs: Date.now() - t0,
            retries: _retries, circuitState: CB.getState(),
            redisMs: (data as { redis_latency_ms?: number }).redis_latency_ms,
            inferenceMs: (data as { inference_latency_ms?: number }).inference_latency_ms,
        });

        return res.status(200).json(data);

    } catch (err: unknown) {
        const e      = err as AxiosError & { code?: string };
        const code   = e.code ?? "UNKNOWN";
        const status = e.response?.status ?? null;

        log("error", "chat_failed", {
            requestId, userId, role,
            code, status, totalMs: Date.now() - t0,
            message: e.message,
            circuitState: CB.getState(),
            stack: e.stack?.split("\n").slice(0, 5).join(" | "),
        });
        return res.status(503).json({
            error: "ai_unavailable",
            message: "The AI service is temporarily unavailable. Please try again in a moment.",
            requestId,
        });
    }
};

export const aiFeedback = async (req: Request, res: Response) => {
    const requestId = (req.headers["x-request-id"] as string) || `${Date.now()}`;
    try {
        const { messageId, message, reply, role, feedback } = req.body as {
            messageId: string; message: string; reply: string; role: string; feedback: number;
        };
        if (!messageId || !message || !reply || !role || ![1, -1].includes(feedback)) {
            return res.status(400).json({ error: "Missing or invalid feedback fields" });
        }
        await aiAxios.post("/feedback", { messageId, message, reply, role, feedback }, {
            timeout: 5_000,
            headers: { "X-Request-ID": requestId },
        });
        return res.status(204).send();
    } catch (err: unknown) {
        log("warn", "feedback_failed", { requestId, reason: (err as Error).message });
        return res.status(204).send();
    }
};
