import "dotenv/config";
import { app } from './app.js';
import ConnectDb from "./config/db/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startPayment } from "./config/paymentConsumer.js";

const PORT = process.env.PORT || 9000;

const start = async () => {
      try {
            await Promise.all([ConnectDb(), connectRabbitMQ()]);

            await startPayment();

            const server = app.listen(PORT, () => {
                  console.log(`✅ [Restaurant Service] Running at http://localhost:${PORT}`);
            });

            server.on("error", (err) => {
                  console.error("[Restaurant Service] HTTP server error:", err);
                  process.exit(1);
            });

            process.on("unhandledRejection", (reason) => {
                  console.error("[Restaurant Service] Unhandled rejection:", reason);
                  process.exit(1);
            });

            process.on("uncaughtException", (err) => {
                  console.error("[Restaurant Service] Uncaught exception:", err);
                  process.exit(1);
            });

      } catch (err) {
            console.error("[Restaurant Service] Startup failed:", err);
            process.exit(1);
      }
};

start();