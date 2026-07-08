import { Request, Response } from "express";
import { aiService, geminiClient } from "../services/index.js";
import { aiChatSchema, aiFeedbackSchema } from "../validators/AiValidator.js";
import { AuthenticatedRequest } from "../middleware/authenticate.js";
import { TryCatch } from "../middleware/TryCatchHandler.js";
import { AuthenticationError } from "../utils/errors.js";

export const aiChat = TryCatch(async (req: Request, res: Response) => {
  const requestId =
    (req.headers["x-request-id"] as string) ||
    (req.headers["x-correlation-id"] as string) ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  res.setHeader("X-Request-ID", requestId);

  if (geminiClient.isWaking()) {
    return res.status(200).json({
      reply: "Kravix AI is waking up — please hold on for about 30 seconds 🙏",
      intent: "WAKING_UP",
      action: "SHOW_WAKING_UP_SIGN",
      intent_confidence: 1.0,
      entities: {},
      followUp: []
    });
  }

  const authUser = (req as AuthenticatedRequest).user;
  if (!authUser || !authUser._id) {
    throw new AuthenticationError("Unauthorized");
  }

  const validated = aiChatSchema.parse(req.body);
  const token = (req.headers.authorization ?? "").replace("Bearer ", "");

  const data = await aiService.chat(
    authUser._id.toString(),
    authUser.role || "customer",
    authUser.name || "User",
    token,
    validated,
    requestId
  );

  return res.status(200).json(data);
});

export const aiFeedback = TryCatch(async (req: Request, res: Response) => {
  const requestId = (req.headers["x-request-id"] as string) || `${Date.now()}`;
  const validated = aiFeedbackSchema.parse(req.body);

  await aiService.feedback(
    validated.messageId,
    validated.message,
    validated.reply,
    validated.role,
    validated.feedback,
    requestId
  );

  return res.status(204).send();
});
