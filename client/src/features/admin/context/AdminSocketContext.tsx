import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { realtimeSocketBaseUrl } from "@/constants";
import { useAdminAuth } from "./AdminAuthContext";

interface AdminSocketContextType {
      socket: Socket | null;
}

const AdminSocketContext = createContext<AdminSocketContextType>({ socket: null });

export const AdminSocketProvider = ({ children }: { children: ReactNode }) => {
      const { isAdminAuth, getAdminToken } = useAdminAuth();
      const socketRef = useRef<Socket | null>(null);
      const [socket, setSocket] = useState<Socket | null>(null);

      useEffect(() => {
            if (!isAdminAuth) {
                  socketRef.current?.disconnect();
                  socketRef.current = null;
                  setSocket(null);
                  return;
            }

            if (socketRef.current) return;

            const token = getAdminToken();
            if (!token) return;

            const newSocket = io(realtimeSocketBaseUrl, {
                  auth: { token },
                  transports: ["websocket"],
                  withCredentials: true,
            });

            socketRef.current = newSocket;

            newSocket.on("connect", () => {
                  newSocket.emit("join:admin");
                  setSocket(newSocket);
                  console.log("✅ Admin socket connected:", newSocket.id);
            });

            newSocket.on("disconnect", () => {
                  setSocket(null);
            });

            return () => {
                  newSocket.disconnect();
                  socketRef.current = null;
                  setSocket(null);
            };
      }, [isAdminAuth]);

      return (
            <AdminSocketContext.Provider value={{ socket }}>
                  {children}
            </AdminSocketContext.Provider>
      );
};

export const useAdminSocket = () => useContext(AdminSocketContext);
