import { Request, Response } from "express";
import { socketService } from "../services/index.js";
import { emitEventSchema } from "../validators/socket.validator.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";

export const socketEmit = TryCatch(async (req: Request, res: Response) => {
  const validated = emitEventSchema.parse(req.body);

  socketService.emitEvent(validated);

  return res.status(200).json({
    success: true,
    message: "Event emitted successfully",
    data: {},
    error: false
  });
});