import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors/cors.js";

const app = express();

app.use(cors(corsOptions));
app.options("/{*path}", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import adminRouter from "./routes/admin.routes.js";
app.use("/api/v1/admin", adminRouter);

app.get("/", (_req, res) => res.send("Admin service running"));

export { app };
