import "dotenv/config";
import http from "http";
import { app } from "./app.js";
import { initializeSocket } from "./config/socket.js";

const PORT = process.env.PORT || 9999;
const SHUTDOWN_TIMEOUT_MS = 10_000;

let isShuttingDown = false;

const server = http.createServer(app);
initializeSocket(server);

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
            await new Promise<void>((resolve, reject) => {
                  server.close((error) => (error ? reject(error) : resolve()));
            });
            console.log("HTTP server closed");
            clearTimeout(forceExit);
            process.exit(0);
      } catch (error) {
            console.error(`Error during shutdown: ${(error as Error).message}`);
            process.exit(1);
      }
};

server.on("error", (error: Error) => {
      console.error(`HTTP server error: ${error.message}`);
      shutdown("serverError");
});

server.listen(PORT, () => {
      console.log(`✅ [Realtime Service] Running at http://localhost:${PORT}`);
});

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
