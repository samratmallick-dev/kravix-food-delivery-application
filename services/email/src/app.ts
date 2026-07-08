import "dotenv/config";
import "./config/env.config.js";
import express from "express";
import corsPackage from "cors";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { corsOptions } from "./config/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { contentNegotiation } from "./middleware/contentNegotiation.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { correlationId } from "./middleware/correlationId.js";
import { openApiSpec } from "./docs/openapi.js";
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
app.use(correlationId);
app.use(requestLogger("email"));
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
  let rabbitStatus = false;
  try {
    const conn = getRabbitMQConnection();
    if (conn) rabbitStatus = true;
  } catch (_) {}
  res.status(rabbitStatus ? 200 : 503).json({
    status: rabbitStatus ? "READY" : "NOT_READY",
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

app.use("/api/v1", (req, res, next) => {
  res.json({ service: "kravix-email", status: "ok", message: "Email service - RabbitMQ consumer only" });
});

app.get("/", (_req, res) => {
  res.json({ service: "kravix-email", status: "ok" });
});

app.use(errorHandler);

export { app };
