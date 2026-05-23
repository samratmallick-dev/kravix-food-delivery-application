import "dotenv/config";
import { app } from "./app.js";
import connectDb from "./config/db/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startAdminOrderConsumer } from "./config/adminOrderConsumer.js";

const PORT = process.env.PORT || 6000;

const start = async () => {
      try {
            await Promise.all([connectDb(), connectRabbitMQ()]);

            await startAdminOrderConsumer();

            const server = app.listen(PORT, () => {
                  console.log(`✅ [Admin Service] Running at http://localhost:${PORT}`);
            });

            server.on("error", (err) => {
                  console.error("[Admin Service] HTTP server error:", err);
                  process.exit(1);
            });

            process.on("unhandledRejection", (reason) => {
                  console.error("[Admin Service] Unhandled rejection:", reason);
                  process.exit(1);
            });

            process.on("uncaughtException", (err) => {
                  console.error("[Admin Service] Uncaught exception:", err);
                  process.exit(1);
            });

      } catch (err) {
            console.error("[Admin Service] Startup failed:", err);
            process.exit(1);
      }
};

start();
