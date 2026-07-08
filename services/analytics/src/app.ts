import "dotenv/config";
import "./config/env.config.js";
import express from "express";
import corsPackage from "cors";
import mongoose from "mongoose";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import analyticsRouter from "./routes/analytics.routes.js";

const app = express();

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

app.use(corsPackage(corsOptions));
app.options("/{*path}", corsPackage(corsOptions));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(requestLogger("analytics"));

let requestCount = 0;
let errorCount = 0;

app.use((req, res, next) => {
  requestCount++;
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      errorCount++;
    }
  });
  next();
});

app.get("/live", (req, res) => {
  res.status(200).send("OK");
});

app.get("/ready", async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1;
  res.status(mongoStatus ? 200 : 503).json({
    status: mongoStatus ? "READY" : "NOT_READY",
    mongodb: mongoStatus ? "UP" : "DOWN"
  });
});

app.get("/health", async (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString()
  });
});

app.get("/metrics", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send(`# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${requestCount}

# HELP http_errors_total Total number of HTTP errors
# TYPE http_errors_total counter
http_errors_total ${errorCount}
`);
});

app.use("/api/v1/analytics", analyticsRouter);

app.get("/", (req, res) => {
  res.send("Analytics Service is active!");
});

app.use(errorHandler);

export { app };
