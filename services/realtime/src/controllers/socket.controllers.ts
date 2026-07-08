import { Request, Response } from "express";
import { socketService } from "../services/index.js";
import { emitEventSchema } from "../validators/socket.validator.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { ValidationError, AuthorizationError } from "../utils/errors.js";

export const socketEmit = TryCatch(async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    throw new AuthorizationError("Forbidden: Invalid or missing internal key");
  }

  const validated = emitEventSchema.parse(req.body);

  socketService.emitEvent(validated);

  return res.status(200).json({
    success: true,
    message: "Event emitted successfully",
    error: false
  });
});