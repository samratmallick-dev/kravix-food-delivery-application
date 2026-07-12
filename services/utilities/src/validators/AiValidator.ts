import { z } from "zod";

export const aiChatSchema = z.object({
  message: z.string().min(1),
  restaurantId: z.string().optional(),
  currentPage: z.string().optional(),
  currentModule: z.string().optional(),
  preferredLanguage: z.string().optional(),
  recentActions: z.array(z.string()).optional()
});

export const aiFeedbackSchema = z.object({
  messageId: z.string().min(1),
  message: z.string().min(1),
  reply: z.string().min(1),
  role: z.string().min(1),
  feedback: z.union([z.literal(1), z.literal(-1)])
});
