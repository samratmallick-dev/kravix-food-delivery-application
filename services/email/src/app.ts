import "dotenv/config";
import "./config/env.config.js";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { contentNegotiation } from "./middleware/contentNegotiation.js";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { openApiSpec } from "./docs/openapi.js";
import { getRabbitMQConnection } from "./config/rabbitmq.js";

const app = express();

app.use(generalLimiter);

app.use(helmet({ crossOriginOpenerPolicy: false }));
app.use(compression());

app.use(express.json());
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

app.get("/", (_req, res) => {
  res.json({ service: "kravix-email", status: "ok" });
});

app.use(errorHandler);

export { app };
