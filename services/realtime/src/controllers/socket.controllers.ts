import { Request, Response } from "express";
import { socketService } from "../services/index.js";
import { emitEventSchema } from "../validators/socket.validator.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { successResponse } from "../utils/response.js";

export const socketEmit = TryCatch(async (req: Request, res: Response) => {
  const validated = emitEventSchema.parse(req.body);
  socketService.emitEvent(validated);
  return successResponse(res, 200, "Event emitted successfully");
});
