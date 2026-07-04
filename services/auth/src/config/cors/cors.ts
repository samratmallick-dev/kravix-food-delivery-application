import { CorsOptions } from "cors";

const allowedOrigins = (): string[] => {
      const defaultOrigins: string[] = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
      ];

      const envOrigins: string[] = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(",")
                  .map((o: string) => o.trim())
                  .filter(Boolean)
            : [];

      const clientUrl = process.env.CLIENT_URL;
      if (clientUrl) {
            envOrigins.push(clientUrl.trim());
      }

      return [...new Set([...defaultOrigins, ...envOrigins])];
};

export const corsOptions: CorsOptions = {
      origin: (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void,
      ) => {
            if (!origin) return callback(null, true);

            const origins = allowedOrigins().map((o) => o.toLowerCase().replace(/\/$/, ""));
            const normalizedOrigin = origin.toLowerCase().replace(/\/$/, "");

            const isAllowed =
                  origins.includes(normalizedOrigin) ||
                  normalizedOrigin.endsWith("vercel.app") ||
                  normalizedOrigin.includes("vercel.app");

            if (isAllowed) {
                  return callback(null, true);
            }

            return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Cache-Control",
            "Expires",
            "Pragma",
            "X-Requested-With",
            "x-internal-key",
      ],
      exposedHeaders: ["X-Cache"],
};

