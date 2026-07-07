import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";

const app = express();

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

import socketInternalRoute from "./routes/internal.routes.js";
app.use("/api/v1/socket", socketInternalRoute);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
      res.status(err.status ?? 500).json({
            success: false,
            message: err.message ?? "Internal server error",
            error: true,
      });
};
app.use(errorHandler);

export { app };