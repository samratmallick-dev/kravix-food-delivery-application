import "dotenv/config";
import { app } from "./app.js";
import connectDb from "./config/db/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 6002;

const start = async () => {
      try {
            await Promise.all([connectDb(), connectRabbitMQ()]);

            const server = app.listen(PORT, () => {
                  console.log(`✅ [Analytics Service] Running at http://localhost:${PORT}`);
            });

            server.on("error", (err) => {
                  console.error("[Analytics Service] HTTP server error:", err);
                  process.exit(1);
            });

            process.on("unhandledRejection", (reason) => {
                  console.error("[Analytics Service] Unhandled rejection:", reason);
                  process.exit(1);
            });

            process.on("uncaughtException", (err) => {
                  console.error("[Analytics Service] Uncaught exception:", err);
                  process.exit(1);
            });

      } catch (err) {
            console.error("[Analytics Service] Startup failed:", err);
            process.exit(1);
      }
};

start();
