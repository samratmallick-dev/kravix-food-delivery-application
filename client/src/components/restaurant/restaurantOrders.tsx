import { useEffect, useCallback, useRef, useState } from "react";
import type { IOrder } from "../../types/types";
import { useSocket } from "../../context/SocketContext";
import audio from "../../assets/restaurant_order_recived.mp3";
import axios from "axios";
import { orderBaseUrl } from "../common/constant";
import { ShoppingBag, VolumeX } from "lucide-react";
import OrderCard from "./orderCard";
import toast from "react-hot-toast";

const ALLOWED_STATUSES = [
      "placed",
      "accepted",
      "preparing",
      "ready_for_rider",
      "rider_assigned",
      "picked_up",
      "out_for_delivery",
      "reached_delivery_location"
];

const AudioBanner = ({ onEnable }: { onEnable: () => void }) => (
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
            <div className="flex items-center gap-3">
                  <VolumeX size={20} className="text-amber-500 shrink-0" />
                  <div>
                        <p className="text-sm font-semibold text-amber-800">Enable sound notifications</p>
                        <p className="text-xs text-amber-600">Get notified when new orders arrive</p>
                  </div>
            </div>
            <button
                  onClick={onEnable}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
            >
                  Enable
            </button>
      </div>
);

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {
      const [orders, setOrders] = useState<IOrder[]>([]);
      const [loading, setLoading] = useState(true);
      const [audioUnlocked, setAudioUnlocked] = useState(false);

      const { socket } = useSocket();
      const audioRef = useRef<HTMLAudioElement | null>(null);

      const enableAudio = async () => {
            try {
                  const audioEl = new Audio(audio);
                  await audioEl.play();
                  audioEl.pause();
                  audioEl.currentTime = 0;
                  audioRef.current = audioEl;
                  setAudioUnlocked(true);
                  toast.success("Audio notification enabled");
            } catch (err) {
                  toast.error("Failed to enable sound notifications.");
                  console.log("Audio unlock failed:", err);
            }
      };

      const fetchOrders = useCallback(async () => {
            try {
                  const { data } = await axios.get(`${orderBaseUrl}/restaurants/${restaurantId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                  });
                  setOrders(data.data.orders || []);
            } catch (error) {
                  console.log(error);
            } finally {
                  setLoading(false);
            }
      }, [restaurantId]);

      const handleStatusUpdate = (orderId: string, newStatus: IOrder["status"]) => {
            setOrders((prev) =>
                  prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o)
            );
      };

      useEffect(() => {
            fetchOrders();
      }, [fetchOrders]);

      useEffect(() => {
            if (!socket) return;

            const onNewOrder = () => {
                  fetchOrders();
                  if (audioUnlocked && audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch((err) => console.log("Audio play failed:", err));
                  }
            };
            const onOrderUpdate = ({ orderId, status }: { orderId: string; status: IOrder["status"] }) => {
                  setOrders((prev) =>
                        prev.map((o) => o._id === orderId ? { ...o, status } : o)
                  );
            };

            socket.on("order:new", onNewOrder);
            socket.on("order:update", onOrderUpdate);

            return () => {
                  socket.off("order:new", onNewOrder);
                  socket.off("order:update", onOrderUpdate);
            };
      }, [socket, audioUnlocked, fetchOrders]);

      if (loading) {
            return (
                  <div className="pt-10 container-app flex items-center justify-center">
                        <p className="text-gray-500">Loading orders...</p>
                  </div>
            );
      }

      const activeOrders = orders.filter((odr) => ALLOWED_STATUSES.includes(odr.status));
      const completedOrders = orders.filter((odr) => !ALLOWED_STATUSES.includes(odr.status));

      if (orders.length === 0) {
            return (
                  <div className="container-app py-6">
                        <h1 className="text-gray-700 font-semibold text-2xl mb-6">Orders</h1>
                        {!audioUnlocked && <AudioBanner onEnable={enableAudio} />}
                        <div className="flex flex-col items-center justify-center h-72 gap-3 text-gray-400">
                              <ShoppingBag size={40} strokeWidth={1.5} />
                              <p className="text-sm">No orders yet</p>
                        </div>
                  </div>
            );
      }

      return (
            <div className="pt-10 container-app space-y-6">
                  {!audioUnlocked && <AudioBanner onEnable={enableAudio} />}

                  <h2 className="text-xl font-bold mb-6">
                        Orders <span className="text-sm font-normal text-gray-400">({orders.length})</span>
                  </h2>

                  <div className="space-y-3">
                        <h1 className="text-lg font-semibold text-gray-700">Active Orders</h1>
                        {activeOrders.length === 0 ? (
                              <p className="text-gray-400 text-sm py-3">No active orders</p>
                        ) : (
                              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                                    {activeOrders.map((order) => (
                                          <OrderCard
                                                key={order._id}
                                                order={order}
                                                onStatusUpdate={handleStatusUpdate}
                                          />
                                    ))}
                              </div>
                        )}
                  </div>

                  <div className="space-y-3">
                        <h1 className="text-lg font-semibold text-gray-700">Completed Orders</h1>
                        {completedOrders.length === 0 ? (
                              <p className="text-gray-400 text-sm py-3">No completed orders</p>
                        ) : (
                              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                                    {completedOrders.map((order) => (
                                          <OrderCard
                                                key={order._id}
                                                order={order}
                                                onStatusUpdate={handleStatusUpdate}
                                          />
                                    ))}
                              </div>
                        )}
                  </div>
            </div>
      );
};

export default RestaurantOrders;
