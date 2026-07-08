import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const requestLogger = (serviceName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const correlationId = (req.headers["x-correlation-id"] || req.headers["x-request-id"] || crypto.randomUUID()) as string;
    const requestId = crypto.randomUUID();
    const traceId = (req.headers["x-trace-id"] || crypto.randomUUID()) as string;

    req.headers["x-correlation-id"] = correlationId;
    req.headers["x-request-id"] = requestId;
    req.headers["x-trace-id"] = traceId;

    res.setHeader("X-Correlation-ID", correlationId);
    res.setHeader("X-Request-ID", requestId);
    res.setHeader("X-Trace-ID", traceId);

    const startTime = process.hrtime();

    res.on("finish", () => {
      const diff = process.hrtime(startTime);
      const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
      const userId = (req as any).user?._id?.toString() || "anonymous";

      const logPayload = {
        requestId,
        traceId,
        correlationId,
        service: serviceName,
        userId,
        method: req.method,
        path: req.originalUrl || req.url,
        duration: `${durationMs}ms`,
        status: res.statusCode,
        timestamp: new Date().toISOString()
      };

      console.log(JSON.stringify(logPayload));
    });

    next();
  };
};
