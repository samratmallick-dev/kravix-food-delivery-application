import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";

const Port = process.env.PORT || 5000;

const app = express();

app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));
app.use((req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
      next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

import cloudinaryRoutes from "./routes/cloudinary.routes.js";
app.use("/api/v1/cloudinary", cloudinaryRoutes);

app.listen(Port, () => {
      console.log(`[server]: Server is running at http://localhost:${Port}`);
});