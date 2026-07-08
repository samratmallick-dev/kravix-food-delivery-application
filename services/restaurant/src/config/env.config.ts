import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)),
  ALLOWED_ORIGINS: z.string(),
  MONGO_URI: z.string(),
  DB_NAME: z.string(),
  JWT_SECRET: z.string(),
  INTERNAL_SERVICE_KEY: z.string(),
  RABITMQ_URL: z.string(),
  PAYMENT_QUEUE: z.string(),
  ORDER_READY_QUEUE: z.string(),
  RIDER_QUEUE: z.string(),
  ADMIN_EVENT_QUEUE: z.string(),
  UTILS_SERVICE_URI: z.string(),
  REALTIME_SOCKET_SERVICE_URI: z.string(),
  REDIS_URL: z.string(),
  GEMINI_API_KEY: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development")
});

export const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Environment validation failed:", parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
};

export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
