import { useEffect, useCallback, useState } from "react";
import type { IOrder } from "../types/types";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { orderBaseUrl } from "../components/common/constant";
import { ShoppingBag, MapPin, Clock, Ban } from "lucide-react";
import { storage } from "../utils/secureStorage";
import toast from "react-hot-toast";

const ACTIVE_STATUSES = [
      "placed",
      "accepted",
      "preparing",
      "ready_for_rider",
      "rider_assigned",
      "picked_up",
      "out_for_delivery",
      "reached_delivery_location"
];

const CustomerOrder = () => {
      const [orders, setOrders] = useState<IOrder[]>([]);
      const [loading, setLoading] = useState(true);
      const navigate = useNavigate();
      const { socket } = useSocket();

      const [confirmCancelOrder, setConfirmCancelOrder] = useState<IOrder | null>(null);
      const [isCancelling, setIsCancelling] = useState(false);

      const handleCancelOrder = async () => {
            if (!confirmCancelOrder) return;
            setIsCancelling(true);
            try {
                  const { data } = await axios.patch(
                        `${orderBaseUrl}/me/${confirmCancelOrder._id}/cancel`,
                        {},
                        {
                              headers: { Authorization: `Bearer ${storage.getToken()}` },
                              withCredentials: true
                        }
                  );
                  setOrders((prev) =>
                        prev.map((o) => o._id === confirmCancelOrder._id ? { ...o, status: "cancelled" } : o)
                  );
                  toast.success(data.message || "Order cancelled successfully");
                  setConfirmCancelOrder(null);
            } catch (err: any) {
                  toast.error(err?.response?.data?.message ?? "Failed to cancel order");
            } finally {
                  setIsCancelling(false);
            }
      };

      const fetchOrders = useCallback(async () => {
            try {
                  const { data } = await axios.get(`${orderBaseUrl}/me`, {
                        headers: { Authorization: `Bearer ${storage.getToken()}` },
                        withCredentials: true
                  });
                  setOrders(data.data.orders || []);
            } catch (error) {
                  console.log(error);
            } finally {
                  setLoading(false);
            }
      }, []);

      useEffect(() => {
            fetchOrders();
      }, [fetchOrders]);

      useEffect(() => {
            if (!socket) return;

            const handleOrderUpdate = ({ orderId, status }: { orderId: string; status: IOrder["status"] }) => {
                  setOrders((prev) =>
                        prev.map((o) => o._id === orderId ? { ...o, status } : o)
                  );
            };

            socket.on("order:update", handleOrderUpdate);

            return () => {
                  socket.off("order:update", handleOrderUpdate);
            };
      }, [socket]);

      if (loading) {
            return (
                  <div className="container-app py-6 space-y-4">
                        <div className="flex flex-col gap-2">
                              <div className="h-8 w-36 bg-gray-200 rounded-lg animate-pulse" />
                              <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                        <div className="space-y-3">
                              <div className="h-5 w-28 bg-gray-200 rounded-lg animate-pulse" />
                              {[...Array(3)].map((_, i) => (
                                    <div key={i} className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                                          <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                                                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                                                </div>
                                                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                                          </div>
                                          <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                                          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                                <div className="flex gap-3">
                                                      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                                                      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                                                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                                                </div>
                                                <div className="h-4 w-14 bg-gray-200 rounded animate-pulse" />
                                          </div>
                                          <div className="flex justify-end">
                                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                          </div>
                                    </div>
                              ))}
                        </div>
                  </div>
            );
      }

      if (orders.length === 0) {
            return (
                  <div className="container-app py-6">
                        <h1 className="text-gray-700 font-semibold mb-6 text-2xl">My Orders</h1>
                        <div className="flex flex-col items-center justify-center h-72 gap-3 text-gray-400">
                              <ShoppingBag size={40} strokeWidth={1.5} />
                              <p className="text-sm">No orders yet</p>
                        </div>
                  </div>
            );
      }

      const activeOrders = orders.filter((odr) => ACTIVE_STATUSES.includes(odr.status));
      const completedOrders = orders.filter((odr) => !ACTIVE_STATUSES.includes(odr.status));

      return (
            <div className="py-6 space-y-4 max-w-4xl mx-auto container px-2">
                  <div className="flex flex-col gap-2">
                        <h1 className="text-gray-700 font-semibold text-2xl">My Orders</h1>
                        <span className="text-gray-700 text-sm font-semibold flex items-center">
                              Total Orders: {orders.length}
                        </span>
                  </div>
                  {activeOrders.length > 0 && (
                        <section className="space-y-3">
                              <h2 className="font-semibold text-gray-700 text-2xl">Active Orders</h2>
                              {activeOrders.map((order) => (
                                    <OrderRow
                                          key={order._id}
                                          order={order}
                                          onClick={() => navigate(`/orders/${order._id}`)}
                                          onCancel={(o) => setConfirmCancelOrder(o)}
                                    />
                              ))}
                        </section>
                  )}
                  {completedOrders.length > 0 && (
                        <section className="space-y-3">
                              <h2 className="font-semibold text-gray-700 text-2xl">Completed Orders</h2>
                              {completedOrders.map((order) => (
                                    <OrderRow
                                          key={order._id}
                                          order={order}
                                          onClick={() => navigate(`/orders/${order._id}`)}
                                          onCancel={(o) => setConfirmCancelOrder(o)}
                                    />
                              ))}
                        </section>
                  )}

                  {confirmCancelOrder && (
                        <div 
                              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300"
                              onClick={() => setConfirmCancelOrder(null)}
                        >
                              <div 
                                    className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4"
                                    onClick={(e) => e.stopPropagation()}
                              >
                                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto">
                                          <Ban size={22} />
                                    </div>
                                    <div className="text-center space-y-1">
                                          <h3 className="text-base font-bold text-gray-800">Cancel your order?</h3>
                                          <p className="text-xs text-gray-500">Are you sure you want to cancel order #{confirmCancelOrder._id.slice(-8).toUpperCase()}?</p>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                          <button 
                                                onClick={() => setConfirmCancelOrder(null)} 
                                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 active:scale-95 transition cursor-pointer"
                                          >
                                                No, Keep Order
                                          </button>
                                          <button 
                                                onClick={handleCancelOrder} 
                                                disabled={isCancelling}
                                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold active:scale-95 transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
                                          >
                                                {isCancelling ? (
                                                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                ) : "Yes, Cancel"}
                                          </button>
                                    </div>
                              </div>
                        </div>
                  )}
            </div>
      );
};

const STATUS_CONFIG: Record<IOrder["status"], { label: string; color: string }> = {
      placed: { label: "Order Placed", color: "bg-yellow-100 text-yellow-800" },
      accepted: { label: "Accepted", color: "bg-blue-100 text-blue-800" },
      preparing: { label: "Preparing", color: "bg-orange-100 text-orange-800" },
      ready_for_rider: { label: "Ready for Rider", color: "bg-purple-100 text-purple-800" },
      rider_assigned: { label: "Rider Assigned", color: "bg-indigo-100 text-indigo-800" },
      picked_up: { label: "Picked Up", color: "bg-cyan-100 text-cyan-800" },
      out_for_delivery: { label: "Out for Delivery", color: "bg-teal-100 text-teal-800" },
      reached_delivery_location: { label: "Reached Location", color: "bg-lime-100 text-lime-800" },
      delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

const OrderRow = ({ order, onClick, onCancel }: { order: IOrder; onClick: () => void; onCancel: (order: IOrder) => void }) => {
      const { label, color } = STATUS_CONFIG[order.status] ?? {
            label: order.status,
            color: "bg-gray-100 text-gray-700"
      };
      const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
      });

      return (
            <div className="border border-gray-200 rounded-2xl p-4 bg-white hover:shadow-lg transition">
                  <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{order.restaurantName}</p>
                              <p className="text-xs text-gray-400 mt-0.5">#{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>
                              {label}
                        </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-400 truncate">{order.items.map(i => i.name).join(", ")}</p>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                    <ShoppingBag size={13} />
                                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                              </span>
                              <span className="flex items-center gap-1">
                                    <MapPin size={13} />
                                    {order.distance} km
                              </span>
                              <span className="flex items-center gap-1">
                                    <Clock size={13} />
                                    {date}
                              </span>
                        </div>
                        <p className="font-bold text-gray-800">₹{order.totalAmount}</p>
                  </div>
                  <div className="mt-3 flex justify-end items-center gap-4">
                        {["placed", "accepted"].includes(order.status) && (
                              <button
                                    onClick={(e) => {
                                          e.stopPropagation();
                                          onCancel(order);
                                    }}
                                    className="text-sm text-red-600 font-semibold hover:underline cursor-pointer"
                              >
                                    Cancel
                              </button>
                        )}
                        <button
                              onClick={() => {
                                    onClick();
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="text-sm text-blue-600 font-semibold hover:underline"
                        >
                              View Details
                        </button>
                  </div>
            </div>
      );
};

export default CustomerOrder;