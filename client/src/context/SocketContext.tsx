import {
      createContext,
      useContext,
      useEffect,
      useRef,
      type ReactNode
} from "react";

import { Socket, io } from "socket.io-client";
import { realtimeSocketBaseUrl } from "../components/common/constant";
import { useAppData } from "./AppContext";

interface SocketContextType {
      socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
      const { isAuth } = useAppData();
      const socketRef = useRef<Socket | null>(null);

      useEffect(() => {
            if (!isAuth) {
                  socketRef.current?.disconnect();
                  socketRef.current = null;
                  return;
            }

            if (socketRef.current) return;

            const token = localStorage.getItem("token");

            if (!token) {
                  console.log("No token found for socket connection");
                  return;
            }

            const socket = io(realtimeSocketBaseUrl, {
                  auth: { token },
                  transports: ["websocket"],
                  withCredentials: true,
            });

            socketRef.current = socket;

            socket.on("connect", () => {
                  console.log("✅ Socket connected:", socket.id);
            });

            socket.on("disconnect", (reason) => {
                  console.log("❌ Socket disconnected:", reason);
            });

            socket.on("connect_error", (err) => {
                  console.log("🚨 Socket connection error:", err.message);
            });

            return () => {
                  socket.disconnect();
                  socketRef.current = null;
            };

      }, [isAuth]);

      return (
            <SocketContext.Provider value={{ socket: socketRef.current }}>
                  {children}
            </SocketContext.Provider>
      );
};

export const useSocket = () => {
      const context = useContext(SocketContext);
      if (!context) throw new Error("useSocket must be used within SocketProvider");
      return context;
};