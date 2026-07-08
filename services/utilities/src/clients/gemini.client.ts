import axios, { AxiosInstance, AxiosError } from "axios";
import http from "http";
import https from "https";
import { IGeminiClient } from "../interfaces/IGeminiClient.js";
import { CircuitBreaker } from "../utils/circuitBreaker.js";

interface Waiter {
  resolve: () => void;
  reject: (e: Error) => void;
  ts: number;
}

export class GeminiClient implements IGeminiClient {
  private readonly aiAxios: AxiosInstance;
  private readonly breaker: CircuitBreaker;
  private readonly coldStartQueue: Waiter[] = [];
  private coldStartWaking = false;
  private coldStartStartedAt = 0;
  private coldStartPollTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const aiUrl = (process.env.AI_MICROSERVICE_URL || "http://localhost:5500").replace(/\/$/, "");
    this.aiAxios = axios.create({
      baseURL: aiUrl,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 20, timeout: 40000 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 20, timeout: 40000 }),
      timeout: 35000
    });
    this.breaker = new CircuitBreaker("GeminiAI", 5, 30000);
  }

  isWaking(): boolean {
    return this.coldStartWaking;
  }

  async ready(): Promise<any> {
    const res = await this.aiAxios.get("/ready", { timeout: 4000 });
    return res.data;
  }

  async chat(payload: any, requestId: string): Promise<any> {
    if (this.breaker.shouldBlock()) {
      const state = this.breaker.getState();
      if (state === "OPEN") {
        await this.waitColdStart();
      } else {
        throw new Error("circuit_open");
      }
    }

    let lastErr: AxiosError | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await this.aiAxios.post("/chat", payload, {
          headers: { "X-Correlation-ID": requestId, "X-Request-ID": requestId }
        });
        this.breaker.recordSuccess();
        return res.data;
      } catch (err: any) {
        lastErr = err as AxiosError;
        const code = lastErr.code ?? "UNKNOWN";
        const status = lastErr.response?.status ?? 0;
        const retryable = this.isRetryable(lastErr);

        if (attempt === 0 && retryable && (code === "ECONNREFUSED" || status === 503 || status === 502)) {
          try {
            await this.waitColdStart();
            continue;
          } catch (csErr: any) {
            this.breaker.recordFailure();
            throw csErr;
          }
        }

        if (!retryable || attempt === maxRetries) {
          this.breaker.recordFailure();
          break;
        }

        const backoff = 1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 800);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    throw lastErr ?? new Error("ai_call_exhausted");
  }

  async sendFeedback(payload: any, requestId: string): Promise<void> {
    await this.aiAxios.post("/feedback", payload, {
      timeout: 5000,
      headers: { "X-Request-ID": requestId }
    });
  }

  private isRetryable(err: AxiosError): boolean {
    const code = err.code ?? "";
    const status = err.response?.status ?? 0;
    return (
      ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNABORTED", "EPIPE"].includes(code) ||
      status === 429 || status === 502 || status === 503 || status === 504
    );
  }

  private waitColdStart(): Promise<void> {
    if (this.coldStartQueue.length >= 40) {
      return Promise.reject(new Error("cold_start_queue_full"));
    }
    return new Promise<void>((resolve, reject) => {
      this.coldStartQueue.push({ resolve, reject, ts: Date.now() });
      this.startPollingColdStart();
    });
  }

  private startPollingColdStart() {
    if (this.coldStartPollTimer) return;
    this.coldStartWaking = true;
    this.coldStartStartedAt = Date.now();

    this.coldStartPollTimer = setInterval(async () => {
      try {
        const res = await this.aiAxios.get("/ready", { timeout: 3000 });
        if (res.status === 200 || res.status === 503) {
          this.resolveAllColdStart();
        }
      } catch {
        const elapsed = Date.now() - this.coldStartStartedAt;
        if (elapsed > 70000) {
          this.rejectAllColdStart(new Error("cold_start_timeout"));
        }
      }
    }, 4000);
  }

  private resolveAllColdStart() {
    this.clearColdStart();
    this.coldStartQueue.splice(0).forEach((w) => w.resolve());
  }

  private rejectAllColdStart(err: Error) {
    this.clearColdStart();
    this.coldStartQueue.splice(0).forEach((w) => w.reject(err));
  }

  private clearColdStart() {
    if (this.coldStartPollTimer) {
      clearInterval(this.coldStartPollTimer);
      this.coldStartPollTimer = null;
    }
    this.coldStartWaking = false;
  }
}
