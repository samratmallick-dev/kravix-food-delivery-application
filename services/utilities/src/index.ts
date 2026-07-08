import "dotenv/config";
import { app } from "./app.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 8888;

const start = async () => {
  try {
    await connectRabbitMQ();
    app.listen(PORT, () => {
      console.log(`[Utilities Service]: Utilities Service is running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Utilities Service startup failed:", err);
    process.exit(1);
  }
};

start();