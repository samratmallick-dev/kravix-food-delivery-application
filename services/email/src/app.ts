import "dotenv/config";
import express, { ErrorRequestHandler } from "express";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ service: "kravix-email", status: "ok" });
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