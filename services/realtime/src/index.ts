import "dotenv/config";
import http from "http";
import { app } from "./app.js";
import { initializeSocket } from "./config/socket.js";

const PORT = process.env.PORT || 9999;

const server = http.createServer(app);
initializeSocket(server);

server.listen(PORT, () => {
      console.log(
            `[Socket server]: Socket Server is running at http://localhost:${PORT}`,
      );
});
