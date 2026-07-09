import {
      createContext,
      useContext,
      useEffect,
      useRef,
      useState,
      type ReactNode
} from "react";
import toast from "react-hot-toast";

import { Socket, io } from "socket.io-client";
import { realtimeSocketBaseUrl } from "../components/common/constant";
import { useAppData } from "./AppContext";
import { storage } from "../utils/secureStorage";

interface SocketContextType {
      socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
      const { isAuth, setUser } = useAppData();
      const socketRef = useRef<Socket | null>(null);
      const [socket, setSocket] = useState<Socket | null>(null);

      useEffect(() => {
            if (!isAuth) {
                  socketRef.current?.disconnect();
                  socketRef.current = null;
                  setSocket(null);
                  return;
            }

            if (socketRef.current) return;

            const token = storage.getToken();
            if (!token) {
                  console.log("No token found for socket connection");
                  return;
            }

            const newSocket = io(realtimeSocketBaseUrl, {
                  auth: { token },
                  transports: ["websocket"],
                  withCredentials: true,
            });

            socketRef.current = newSocket;

            newSocket.on("connect", () => {
                  console.log("✅ Socket connected:", newSocket.id);
                  setSocket(newSocket);
            });

            newSocket.on("disconnect", (reason) => {
                  if (reason === "io client disconnect") {
                        console.log("ℹ️ Socket disconnected by client");
                  } else {
                        console.log("❌ Socket disconnected:", reason);
                  }
                  setSocket(null);
            });

            newSocket.on("connect_error", (err) => {
                  console.log("🚨 Socket connection error:", err.message);
            });

            newSocket.on("user:blockStatusChanged", ({ isBlocked, blockedUntil }: { isBlocked: boolean; blockedUntil: string | null }) => {
                  setUser((prev) => prev ? { ...prev, isBlocked, blockedUntil } : prev);
            });

            newSocket.on("user:registered", (payload: { userId: string; name: string; email: string; image: string }) => {
                  console.log("[Socket] 📥 user:registered event received:", payload);
                  setUser((prev) =>
                        prev
                              ? {
                                    ...prev,
                                    name: payload.name,
                                    email: payload.email,
                                    image: payload.image,
                              }
                              : prev
                  );
                  toast.success("Profile synced successfully!");
            });

            newSocket.on("user:role_updated", (payload: { userId: string; role: string | null }) => {
                  console.log("[Socket] 📥 user:role_updated event received:", payload);
                  setUser((prev) => prev ? { ...prev, role: payload.role } : prev);
                  toast.success(`Role updated to ${payload.role || "customer"}`);
            });

            return () => {
                  newSocket.disconnect();
                  socketRef.current = null;
                  setSocket(null);
            };
      }, [isAuth]);

      return (
            <SocketContext.Provider value={{ socket }}>
                  {children}
            </SocketContext.Provider>
      );
};

export const useSocket = () => {
      const context = useContext(SocketContext);
      if (!context) throw new Error("useSocket must be used within SocketProvider");
      return context;
};