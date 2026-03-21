import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../../types/types";
import { useSocket } from "../../context/SocketContext";
import audio from "../../assets/restaurant_order_recived.mp3";
import axios from "axios";
import { orderBaseUrl } from "../common/constant";
import { ShoppingBag, VolumeX } from "lucide-react";
import OrderCard from "./orderCard";

const ALLOWED_STATUSES = [
      "placed",
      "accepted",
      "preparing",
      "ready_for_rider",
      "rider_assigned",
      "picked_up"
];

const RestaurantOrders = ({ restaurantId }: { restaurantId: string }) => {

      const [orders, setOrders] = useState<IOrder[]>([]);
      const [loading, setLoading] = useState(true);
      const [audioUnlocked, setAudioUnlocked] = useState(false);

      const { socket } = useSocket();
      const audioRef = useRef<HTMLAudioElement | null>(null);

      useEffect(() => {
            audioRef.current = new Audio(audio);
            audioRef.current.load();
      }, []);

      const unloadAudio = () => {
            if (audioRef.current) {
                  audioRef.current.play().then(() => {
                        audioRef.current!.pause();
                        audioRef.current!.currentTime = 0;
                        setAudioUnlocked(true);
                  }).catch((err) => console.log("Audio unlock failed:", err));
            }
      };

      const fetchOrders = async () => {
            try {
                  const { data } = await axios.get(`${orderBaseUrl}/${restaurantId}`, {
                        headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                        }, withCredentials: true
                  });
                  setOrders(data.data.orders || []);
            } catch (error) {
                  console.log(error);
            } finally {
                  setLoading(false);
            }
      };

      const handleStatusUpdate = (orderId: string, newStatus: IOrder["status"]) => {
            setOrders((prev) =>
                  prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o)
            );
      };

      useEffect(() => {
            fetchOrders();
      }, [restaurantId]);

      useEffect(() => {
            if (!socket) return;

            const onNewOrders = () => {
                  fetchOrders();
                  if (audioUnlocked && audioRef.current) {
                        audioRef.current.currentTime = 0;
                        audioRef.current.play().catch((err) => console.log("Audio play failed:", err));
                  }
            };

            socket.on("order:new", onNewOrders);
            return () => {
                  socket.off("order:new", onNewOrders);
            };
      }, [socket, audioUnlocked]);

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
                        <div className="flex flex-col items-center justify-center h-72 gap-3 text-gray-400">
                              <ShoppingBag size={40} strokeWidth={1.5} />
                              <p className="text-sm">No orders yet</p>
                        </div>
                  </div>
            );
      }

      return (
            <div className="pt-10 container-app space-y-6">
                  {!audioUnlocked && (
                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
                              <div className="flex items-center gap-3">
                                    <VolumeX size={20} className="text-amber-500 shrink-0" />
                                    <div>
                                          <p className="text-sm font-semibold text-amber-800">Enable sound notifications</p>
                                          <p className="text-xs text-amber-600">Get notified when new orders arrive</p>
                                    </div>
                              </div>
                              <button
                                    onClick={unloadAudio}
                                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
                              >
                                    Enable
                              </button>
                        </div>
                  )}
                  <h2 className="text-xl font-bold mb-6">Orders <span className="text-sm font-normal text-gray-400">({orders.length})</span></h2>

                  <div className="space-y-3">
                        <h1 className="text-lg font-semibold text-gray-700">Active Orders</h1>
                        {
                              activeOrders.length === 0 ? (
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
                              )
                        }
                  </div>

                  <div className="space-y-3">
                        <h1 className="text-lg font-semibold text-gray-700">Completed Orders</h1>
                        {
                              completedOrders.length === 0 ? (
                                    <p className="text-gray-400 text-sm py-3">No Completed Orders</p>
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
                              )
                        }
                  </div>
            </div>
      );
};

export default RestaurantOrders;
