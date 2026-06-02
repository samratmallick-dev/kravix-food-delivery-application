import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import { connectRabbitMQ } from "./config/rabitmq.js";

const Port = process.env.PORT || 8888;

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

import cloudinaryRoutes from "./routes/cloudinary.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
app.use("/api/v1/cloudinary", cloudinaryRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.listen(Port, () => {
      console.log(
            `[Utilities Service]: Utilities Service is running at http://localhost:${Port}`,
      );
});

connectRabbitMQ().catch((err) => {
      console.error("Failed to connect to RabbitMQ", err);
});