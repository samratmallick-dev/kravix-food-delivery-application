import { Request, Response, NextFunction } from "express";

const idempotencyStore = new Map<string, { status: number; body: any; timestamp: number }>();
const TTL_MS = 24 * 60 * 60 * 1000;

export const idempotency = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers["idempotency-key"] as string | undefined;

  if (!key) {
    res.status(400).json({
      success: false,
      message: "Idempotency-Key header is required for payment operations",
      error: true,
      code: "MISSING_IDEMPOTENCY_KEY",
      details: []
    });
    return;
  }

  const now = Date.now();
  const cached = idempotencyStore.get(key);

  if (cached) {
    if (now - cached.timestamp < TTL_MS) {
      res.setHeader("X-Idempotency-Replayed", "true");
      res.status(cached.status).json(cached.body);
      return;
    }
    idempotencyStore.delete(key);
  }

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    idempotencyStore.set(key, { status: res.statusCode, body, timestamp: Date.now() });
    return originalJson(body);
  };

  next();
};
