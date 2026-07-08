import { z } from "zod";

export const emitEventSchema = z.object({
  event: z.string().min(1),
  room: z.string().min(1),
  payload: z.any().optional()
});
