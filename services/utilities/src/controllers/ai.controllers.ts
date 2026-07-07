import { Request, Response } from "express";
import axios, { AxiosError } from "axios";

const AI_MICROSERVICE_URL = process.env.AI_MICROSERVICE_URL || "http://0.0.0.0:5500";
const RESTAURANT_BASE_URL = process.env.RESTAURANT_BASE_URL || "http://localhost:9000";

const AI_REQUEST_TIMEOUT_MS = 35_000;
const CONTEXT_FETCH_TIMEOUT_MS = 4_000;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1_500;

const CB = {
    failures: 0,
    threshold: 5,
    openUntil: 0,
    halfOpenProbeAt: 0,
    recoveryMs: 30_000,

    isOpen(): boolean {
        if (this.failures < this.threshold) return false;
        if (Date.now() >= this.openUntil) {
            return false;
        }
        return true;
    },

    recordSuccess() {
        this.failures = 0;
        this.openUntil = 0;
    },

    recordFailure() {
        this.failures++;
        if (this.failures >= this.threshold) {
            this.openUntil = Date.now() + this.recoveryMs;
            console.error(JSON.stringify({
                level: "error", service: "utilities", component: "circuit_breaker",
                event: "circuit_open", failures: this.failures,
                recoveryAt: new Date(this.openUntil).toISOString(),
            }));
        }
    },

    state(): "CLOSED" | "OPEN" | "HALF_OPEN" {
        if (this.failures < this.threshold) return "CLOSED";
        if (Date.now() >= this.openUntil) return "HALF_OPEN";
        return "OPEN";
    },
};

const coldStart = {
    wakingUntil: 0,
    WAKE_WINDOW_MS: 40_000,
    probing: false,
    waiters: [] as Array<() => void>,

    isWaking(): boolean {
        return Date.now() < this.wakingUntil;
    },

    markWaking() {
        this.wakingUntil = Date.now() + this.WAKE_WINDOW_MS;
    },

    markReady() {
        this.wakingUntil = 0;
        this.probing = false;
        const w = this.waiters.splice(0);
        w.forEach((resolve) => resolve());
    },

    async waitForWake(): Promise<void> {
        if (!this.probing) return;
        return new Promise<void>((resolve) => {
            this.waiters.push(resolve);
        });
    },
};

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
): Promise<{ reply: string; intent_confidence: number; _latencyMs: number; _retries: number }> {

    if (CB.isOpen()) {
        console.warn(JSON.stringify({
            level: "warn", service: "utilities", component: "circuit_breaker",
            event: "circuit_rejected", requestId, userId, role, state: CB.state(),
        }));
        throw new Error("circuit_open");
    }

    if (coldStart.isWaking() && coldStart.probing) {
        await coldStart.waitForWake();
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
            coldStart.markReady();

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

            if (!retryable || attempt === MAX_RETRIES) {
                CB.recordFailure();
                break;
            }

            if (attempt === 0 && retryable) {
                coldStart.markWaking();
                coldStart.probing = true;
            }

            totalRetries++;
            const backoffMs = RETRY_BASE_MS * Math.pow(2, attempt);
            await sleep(backoffMs);
        }
    }

    coldStart.markReady(); 
    throw lastError;
}

async function fetchContextData(
    authToken: string,
    restaurantId: string | undefined,
    requestId: string
): Promise<{
    orders: { id: string; status: string }[];
    menu_items: { name: string; price: number; available: boolean }[];
    _redisLatencyMs?: number;
    _contextLatencyMs: number;
}> {
    const contextStart = Date.now();
    const contextData: {
        orders: { id: string; status: string }[];
        menu_items: { name: string; price: number; available: boolean }[];
        _contextLatencyMs: number;
    } = { orders: [], menu_items: [], _contextLatencyMs: 0 };

    const authHeaders = {
        Authorization: `Bearer ${authToken}`,
        "X-Correlation-ID": requestId,
        "X-Request-ID": requestId,
    };

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

    if (restaurantId) {
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

    contextData._contextLatencyMs = Date.now() - contextStart;
    return contextData;
}

export const aiChat = async (req: Request, res: Response) => {
    const requestId =
        (req.headers["x-request-id"] as string) ||
        (req.headers["x-correlation-id"] as string) ||
        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const { message, userId, role, restaurantId } = req.body;

    if (!message || !userId || !role) {
        return res.status(400).json({ error: "Missing required fields: message, userId, role" });
    }

    const requestStart = Date.now();
    const authToken = req.headers.authorization?.split(" ")[1] ?? "";

    const contextData = await fetchContextData(authToken, restaurantId, requestId);
    const contextLatencyMs = contextData._contextLatencyMs;

    try {
        const { _latencyMs: aiLatencyMs, _retries: retries, ...data } =
            await callAIWithRetry({ message, userId, role, contextData }, requestId, userId, role);

        const totalMs = Date.now() - requestStart;
        console.log(JSON.stringify({
            level: "info", service: "utilities", component: "ai_controller",
            event: "chat_complete", requestId, userId, role,
            contextLatencyMs, aiLatencyMs, totalMs, retries,
            circuitState: CB.state(),
        }));

        res.setHeader("X-Request-ID", requestId);
        return res.status(200).json(data);
    } catch (error: any) {
        const totalMs = Date.now() - requestStart;
        const axiosErr = error as AxiosError;
        const status = axiosErr.response?.status ?? null;
        const errorCode = axiosErr.code ?? error.message ?? "UNKNOWN";

        console.error(JSON.stringify({
            level: "error", service: "utilities", component: "ai_controller",
            event: "chat_failed", requestId, userId, role,
            errorCode, status, totalMs,
            retriesExhausted: MAX_RETRIES,
            circuitState: CB.state(),
        }));

        res.setHeader("X-Request-ID", requestId);
        return res.status(200).json({
            reply: "I'm currently unavailable. Please try again in a moment.",
            intent_confidence: 0,
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
