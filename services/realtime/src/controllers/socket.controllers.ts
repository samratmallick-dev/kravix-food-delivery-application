import { Request, Response } from "express";
import { getIO } from "../config/socket.js";

export const socketEmit = async (req: Request, res: Response) => {
      try {
            if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
                  return res.status(403).json({
                        success: false,
                        message: "Forbidden: Invalid or missing internal key",
                        error: true
                  });
            }

            const { event, room, payload } = req.body;

            if (!event || !room) {
                  return res.status(400).json({
                        success: false,
                        message: "Event and room are required",
                        error: true
                  });
            }

            const io = getIO();

            io.to(room).emit(event, payload ?? {});

            return res.status(200).json({
                  success: true,
                  message: "Event emitted successfully",
                  error: false
            });

      } catch (error) {
            return res.status(500).json({
                  success: false,
                  message: error instanceof Error ? error.message : "Internal server error",
                  error: true
            });
      }
};