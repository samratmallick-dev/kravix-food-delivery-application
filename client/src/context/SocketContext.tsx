import {
      createContext,
      useContext,
      useEffect,
      useRef,
      useState,
      type ReactNode
} from "react";

import { Socket, io } from "socket.io-client";
import { realtimeSocketBaseUrl } from "../components/common/constant";
import { useAppData } from "./AppContext";

interface SocketContextType {
      socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const SocketProvider = ({ children }: { children: ReactNode }) => {
      const { isAuth } = useAppData();
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

            const token = localStorage.getItem("token");
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
                  console.log("❌ Socket disconnected:", reason);
                  setSocket(null);
            });

            newSocket.on("connect_error", (err) => {
                  console.log("🚨 Socket connection error:", err.message);
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