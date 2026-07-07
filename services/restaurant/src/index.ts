import "dotenv/config";
import { app } from "./app.js";
import ConnectDb from "./config/db/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 9000;

const start = async () => {
      try {
            await ConnectDb();
            connectRabbitMQ();

            const server = app.listen(PORT, () => {
                  console.log(
                        `✅ [Restaurant Service] Running at http://localhost:${PORT}`,
                  );
            });

            server.on("error", (err) => {
                  console.error("[Restaurant Service] HTTP server error:", err);
                  process.exit(1);
            });

      } catch (err) {
            console.error("[Restaurant Service] Startup failed:", err);
            process.exit(1);
      }
};

start();