import "dotenv/config";
import "./config/env.config.js";
import express from "express";
import corsPackage from "cors";
import { corsOptions } from "./config/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import socketInternalRoute from "./routes/internal.routes.js";
import { getIO } from "./config/socket.js";

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
app.use(requestLogger("realtime"));

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
  let socketReady = false;
  try {
    const io = getIO();
    if (io) {
      socketReady = true;
    }
  } catch (err) {}

  res.status(socketReady ? 200 : 503).json({
    status: socketReady ? "READY" : "NOT_READY",
    socketio: socketReady ? "UP" : "DOWN"
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

app.use("/api/v1/socket", socketInternalRoute);

app.get("/", (req, res) => {
  res.send("Realtime Service is active!");
});

app.use(errorHandler);

export { app };