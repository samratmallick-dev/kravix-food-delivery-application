import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)),
  RABBITMQ_URL: z.string(),
  EMAIL_QUEUE: z.string(),
  CLIENT_URL: z.string(),
  GMAIL_CLIENT_ID: z.string(),
  GMAIL_CLIENT_SECRET: z.string(),
  GMAIL_REFRESH_TOKEN: z.string(),
  GMAIL_REDIRECT_URI: z.string(),
  EMAIL_FROM_ADDRESS: z.string(),
  EMAIL_FROM_NAME: z.string(),
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
