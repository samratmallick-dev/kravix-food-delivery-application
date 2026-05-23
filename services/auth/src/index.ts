import "dotenv/config";
import { app } from "./app.js";
import ConnectDb from "./config/db/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 8000;

const start = async () => {
      try {
            await Promise.all([ConnectDb(), connectRabbitMQ()]);

            const server = app.listen(PORT, () => {
                  console.log(`✅ [Auth Service] Running at http://localhost:${PORT}`);
            });

            server.on("error", (err) => {
                  console.error("[Auth Service] HTTP server error:", err);
                  process.exit(1);
            });

            process.on("unhandledRejection", (reason) => {
                  console.error("[Auth Service] Unhandled rejection:", reason);
                  process.exit(1);
            });

            process.on("uncaughtException", (err) => {
                  console.error("[Auth Service] Uncaught exception:", err);
                  process.exit(1);
            });

      } catch (err) {
            console.error("[Auth Service] Startup failed:", err);
            process.exit(1);
      }
};

start();