import "dotenv/config";
import "./config/env.config.js";
import express from "express";
import corsPackage from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import { corsOptions } from "./config/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { contentNegotiation } from "./middleware/contentNegotiation.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { ROUTES } from "./constants/routes.js";
import { openApiSpec } from "./docs/openapi.js";
import riderRoutes from "./routes/rider.routes.js";
import { getRabbitMQConnection } from "./config/rabbitmq.js";

const app = express();

app.use(generalLimiter);

app.use(helmet({ crossOriginOpenerPolicy: false }));
app.use(compression());
app.use(corsPackage(corsOptions));
app.options("/{*path}", corsPackage(corsOptions));

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(requestLogger("rider"));
app.use(contentNegotiation);

let requestCount = 0;
let errorCount = 0;

app.use((req, res, next) => {
  requestCount++;
  res.on("finish", () => {
    if (res.statusCode >= 400) errorCount++;
  });
  next();
});

app.get("/live", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/ready", async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1;
  let rabbitStatus = false;
  try {
    const conn = getRabbitMQConnection();
    if (conn) rabbitStatus = true;
  } catch (_) {}
  const ready = mongoStatus && rabbitStatus;
  res.status(ready ? 200 : 503).json({
    status: ready ? "READY" : "NOT_READY",
    mongodb: mongoStatus ? "UP" : "DOWN",
    rabbitmq: rabbitStatus ? "UP" : "DOWN"
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

app.get("/metrics", (_req, res) => {
  res.set("Content-Type", "text/plain");
  res.send(
    `# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total ${requestCount}\n\n# HELP http_errors_total Total number of HTTP errors\n# TYPE http_errors_total counter\nhttp_errors_total ${errorCount}\n`
  );
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use("/api/v1" + ROUTES.RIDERS.BASE, riderRoutes);

app.use("/api/v1/riders", (req, res, next) => next());

app.get("/", (_req, res) => {
  res.json({ service: "kravix-rider", status: "ok" });
});

app.use(errorHandler);

export { app };
