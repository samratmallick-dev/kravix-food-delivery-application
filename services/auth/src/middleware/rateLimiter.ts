import rateLimit from "express-rate-limit";

const rateLimitResponse = (message: string) => ({
  success: false,
  message,
  error: true,
  code: "RATE_LIMIT_EXCEEDED",
  details: []
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse("Too many requests. Please try again later.")
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse("Too many authentication attempts. Please try again later.")
});
