import { ExternalServiceError } from "./errors.js";

export class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failures = 0;
  private openUntil = 0;
  private halfOpenProbeInFlight = false;

  constructor(
    public readonly name: string,
    private readonly threshold = 5,
    private readonly recoveryMs = 30000
  ) {}

  getState(): "CLOSED" | "OPEN" | "HALF_OPEN" {
    if (this.state === "OPEN" && Date.now() >= this.openUntil) {
      this.state = "HALF_OPEN";
      this.halfOpenProbeInFlight = false;
    }
    return this.state;
  }

  shouldBlock(): boolean {
    const s = this.getState();
    if (s === "CLOSED") return false;
    if (s === "OPEN") return true;
    if (this.halfOpenProbeInFlight) return true;
    this.halfOpenProbeInFlight = true;
    return false;
  }

  recordSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
    this.openUntil = 0;
    this.halfOpenProbeInFlight = false;
  }

  recordFailure() {
    this.halfOpenProbeInFlight = false;
    this.failures++;
    if (this.failures >= this.threshold || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.openUntil = Date.now() + this.recoveryMs;
    }
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (this.shouldBlock()) {
      throw new ExternalServiceError(`Circuit breaker is OPEN for service: ${this.name}`);
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}
