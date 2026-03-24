import "dotenv/config";
import { app } from "./app.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import connectDb from "./config/db.js";
import { orderReadyConsumer } from "./config/orderReadyConsumer.js";

const PORT = process.env.PORT || 7000;
const start = async () => {
      try {
            await Promise.all([connectDb(), connectRabbitMQ()]);

            await orderReadyConsumer();

            const server = app.listen(PORT, () => {
                  console.log(`✅ [Rider Service] Running at http://localhost:${PORT}`);
            });

            server.on("error", (err) => {
                  console.error("[Rider Service] HTTP server error:", err);
                  process.exit(1);
            });

            process.on("unhandledRejection", (reason) => {
                  console.error("[Rider Service] Unhandled rejection:", reason);
                  process.exit(1);
            });

            process.on("uncaughtException", (err) => {
                  console.error("[Rider Service] Uncaught exception:", err);
                  process.exit(1);
            });

      } catch (err) {
            console.error("[Rider Service] Startup failed:", err);
            process.exit(1);
      }
};

start();