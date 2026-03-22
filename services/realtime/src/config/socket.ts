import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

const allowedOrigins = (): string[] => {
      const defaultOrigins: string[] = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000"
      ];

      const envOrigins: string[] = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS
                  .split(",")
                  .map((o: string) => o.trim())
                  .filter(Boolean)
            : [];

      return [...new Set([...defaultOrigins, ...envOrigins])];
};

let io: Server;

export const initializeSocket = (server: http.Server) => {
      const origins = allowedOrigins();

      io = new Server(server, {
            cors: {
                  origin: (origin, callback) => {
                        if (!origin) return callback(null, true);

                        if (origins.includes(origin)) {
                              return callback(null, true);
                        }

                        console.log("❌ Socket CORS blocked:", origin);
                        return callback(new Error("CORS not allowed"));
                  },
                  credentials: true,
                  methods: ["GET", "POST"],
            },
      });

      io.use((socket, next) => {
            try {
                  const token = socket.handshake.auth?.token;

                  if (!token) {
                        return next(new Error("Unauthorized: No token"));
                  }

                  const decoded = jwt.verify(
                        token,
                        process.env.JWT_SECRET!
                  ) as any;

                  if (!decoded || !decoded._id) {
                        return next(new Error("Unauthorized!"));
                  }

                  socket.data.user = decoded;

                  next();
            } catch (error) {
                  console.log("JWT Error:", error);
                  return next(new Error("Socket auth failed"));
            }
      });
      io.on("connection", (socket) => {
            const user = socket.data.user;

            if (!user) {
                  return socket.disconnect();
            }

            const userId = user._id;

            socket.join(`User:${userId}`);

            if (user.restaurantId) {
                  socket.join(`Restaurant:${user.restaurantId}`);
            }

            socket.on("join:restaurant", (restaurantId: string) => {
                  if (restaurantId) {
                        socket.join(`RestaurantStatus:${restaurantId}`);
                  }
            });

            console.log("🟢 User connected:", userId);
            console.log("🌐 Origin:", socket.handshake.headers.origin);
            console.log("📦 Rooms:", [...socket.rooms]);

            socket.on("disconnect", (reason) => {
                  console.log("🔴 User disconnected:", userId, "|", reason);
            });
      });

      return io;
};

export const getIO = () => {
      if (!io) {
            throw new Error("Socket.io not initialized!");
      }
      return io;
};