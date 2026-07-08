import "dotenv/config";
import "./config/env.config.js";
import express from "express";
import corsPackage from "cors";
import { corsOptions } from "./config/cors/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.routes.js";

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
app.use(requestLogger("auth"));

app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(errorHandler);

export { app };
