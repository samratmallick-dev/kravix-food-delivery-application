import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export interface CorrelationRequest extends Request {
  correlationId?: string;
}

export const correlationId = (
  req: CorrelationRequest,
  res: Response,
  next: NextFunction
): void => {
  const id = req.headers["x-correlation-id"] as string || randomUUID();
  req.correlationId = id;
  res.setHeader("X-Correlation-ID", id);
  next();
};
