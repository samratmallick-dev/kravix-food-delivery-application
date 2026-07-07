import express, {ErrorRequestHandler} from "express";
import cors from "cors";
import analyticsRouter from "./routes/analytics.routes.js";

const app = express();

const corsOptions = {
      origin: process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(",")
            : ["http://localhost:5173", "http://localhost:5174"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));

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

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
      res.status(err.status ?? 500).json({
            success: false,
            message: err.message ?? "Internal server error",
            error: true,
      });
};
app.use(errorHandler);

export { app };
