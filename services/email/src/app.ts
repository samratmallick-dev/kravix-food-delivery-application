import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ service: "kravix-email", status: "ok" });
});

export { app };