import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)),
  ALLOWED_ORIGINS: z.string(),
  CLOUD_NAME: z.string(),
  CLOUD_API_KEY: z.string(),
  CLOUD_API_SECRET: z.string(),
  INTERNAL_SERVICE_KEY: z.string(),
  JWT_SECRET: z.string(),
  RAZORPAY_API_KEY: z.string(),
  RAZORPAY_API_KEY_SECRET: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  RABITMQ_URL: z.string(),
  PAYMENT_QUEUE: z.string(),
  RESTAURANT_BASE_URL: z.string(),
  CLIENT_URL: z.string(),
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
