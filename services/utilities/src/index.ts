import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import { connectRabbitMQ } from "./config/rabitmq.js";

const Port = process.env.PORT || 5000;

const app = express();

connectRabbitMQ().then(() => {
      console.log("RabbitMQ connected");
}).catch ((err) => {
      console.error("Failed to connect to RabbitMQ", err);
      process.exit(1);
});

app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));
app.use((req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
      next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

import cloudinaryRoutes from "./routes/cloudinary.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
app.use("/api/v1/cloudinary", cloudinaryRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.listen(Port, () => {
      console.log(`[server]: Server is running at http://localhost:${Port}`);
});