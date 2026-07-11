import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/rider_order_alert.mp3";

export const useSocketOrders = (
  onOrderUpdate: (orderId: string) => void,
  onRiderVerified: (isVerified: boolean) => void
) => {
  const { socket } = useSocket();
  const [incomingOrders, setIncomingOrders] = useState<string[]>([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const onOrderUpdateRef = useRef(onOrderUpdate);
  onOrderUpdateRef.current = onOrderUpdate;

  const enableAudio = async () => {
    try {
      const el = new Audio(audio);
      await el.play();
      el.pause();
      el.currentTime = 0;
      audioRef.current = el;
      audioUnlockedRef.current = true;
      setAudioUnlocked(true);
      return true;
    } catch {
      return false;
    }
  };

  const dismissOrder = (orderId: string) =>
    setIncomingOrders((prev) => prev.filter((id) => id !== orderId));

  useEffect(() => {
    if (!socket) return;

    const onOrderAvailable = ({ orderId }: { orderId: string }) => {
      setIncomingOrders((prev) => prev.includes(orderId) ? prev : [...prev, orderId]);
      if (audioUnlockedRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      setTimeout(() => dismissOrder(orderId), 10_000);
    };

    const onVerified = ({ isVerified }: { isVerified: boolean }) => onRiderVerified(isVerified);
    const onUpdate = ({ orderId }: { orderId: string }) => onOrderUpdateRef.current(orderId);

    socket.on("order:available", onOrderAvailable);
    socket.on("rider:verified", onVerified);
    socket.on("order:update", onUpdate);

    return () => {
      socket.off("order:available", onOrderAvailable);
      socket.off("rider:verified", onVerified);
      socket.off("order:update", onUpdate);
    };
  }, [socket, onRiderVerified]);

  return { incomingOrders, dismissOrder, audioUnlocked, enableAudio };
};
