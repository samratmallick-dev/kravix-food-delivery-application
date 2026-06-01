import "dotenv/config";
import { app } from "./app.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startEmailConsumer } from "./consumer/email.consumer.js";

const PORT = process.env.PORT ?? 8100;

const start = async () => {
  try {
    await connectRabbitMQ();
    await startEmailConsumer();

    const server = app.listen(PORT, () => {
      console.log(`✅ [Email Service] Running at http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
      console.error("[Email Service] HTTP server error:", err);
      process.exit(1);
    });

    const shutdown = () => {
      console.log("[Email Service] Shutting down gracefully...");
      server.close(() => process.exit(0));
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    console.error("[Email Service] Startup failed:", err);
    process.exit(1);
  }
};

start();
