import "dotenv/config";
import "./config/env.config.js";
import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { getRabbitMQConnection } from "./config/rabbitmq.js";

const app = express();

app.use(express.json());
app.use(requestLogger("email"));

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
  let rabbitStatus = false;
  try {
    const conn = getRabbitMQConnection();
    if (conn) {
      rabbitStatus = true;
    }
  } catch (err) {}

  res.status(rabbitStatus ? 200 : 503).json({
    status: rabbitStatus ? "READY" : "NOT_READY",
    rabbitmq: rabbitStatus ? "UP" : "DOWN"
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

app.get("/", (req, res) => {
  res.json({ service: "kravix-email", status: "ok" });
});

app.use(errorHandler);

export { app };