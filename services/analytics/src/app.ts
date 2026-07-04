import express from "express";
import cors from "cors";
import analyticsRouter from "./routes/analytics.routes.js";

const app = express();

const allowedOrigins = (): string[] => {
      const defaultOrigins = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
      ];
      const envOrigins = process.env.ALLOWED_ORIGINS
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

const corsOptions = {
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
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
      res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
      next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/v1/analytics", analyticsRouter);

app.get("/", (req, res) => {
      res.send("Analytics Service is active!");
});

export { app };
