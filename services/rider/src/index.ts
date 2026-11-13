import "dotenv/config";
import { app } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 7000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

const start = async () => {
      try {
            await connectDB();
            connectRabbitMQ();

            server = app.listen(PORT, () => {
                  console.log(`✅ [Rider Service] Running at http://localhost:${PORT}`);
            });

            server.on("error", (error: Error) => {
                  console.error(`HTTP server error: ${error.message}`);
                  shutdown("serverError");
            });
      } catch (error) {
            console.error(`Failed to start server: ${(error as Error).message}`);
            process.exit(1);
      }
};

const shutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`${signal} received, shutting down gracefully...`);

      const forceExit = setTimeout(() => {
            console.error("Graceful shutdown timed out, forcing exit");
            process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      forceExit.unref();

      try {
            if (server) {
                  await new Promise<void>((resolve, reject) => {
                        server!.close((error) => (error ? reject(error) : resolve()));
                  });
                  console.log("HTTP server closed");
            }

            await disconnectDB();
            clearTimeout(forceExit);
            process.exit(0);
      } catch (error) {
            console.error(`Error during shutdown: ${(error as Error).message}`);
            process.exit(1);
      }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
      console.error("Unhandled promise rejection:", reason);
      shutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
      console.error("Uncaught exception:", error);
      shutdown("uncaughtException");
});

start();
