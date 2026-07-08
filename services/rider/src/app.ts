import "dotenv/config";
import "./config/env.config.js";
import express from "express";
import corsPackage from "cors";
import mongoose from "mongoose";
import { corsOptions } from "./config/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import riderRoutes from "./routes/rider.routes.js";
import { getRabbitMQConnection } from "./config/rabbitmq.js";

const app = express();

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
app.use(requestLogger("rider"));

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
  let rabbitStatus = false;
  try {
    const conn = getRabbitMQConnection();
    if (conn) {
      rabbitStatus = true;
    }
  } catch (err) {}

  const ready = mongoStatus && rabbitStatus;
  res.status(ready ? 200 : 503).json({
    status: ready ? "READY" : "NOT_READY",
    mongodb: mongoStatus ? "UP" : "DOWN",
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

app.use("/api/v1/riders", riderRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(errorHandler);

export { app };