import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import type { IOrder } from "../types/types";
import { useEffect, useCallback, useState } from "react";
import axios from "axios";
import { orderBaseUrl } from "../components/common/constant";
import { MapPin, Phone, Store, CreditCard, Wallet } from "lucide-react";
import CustomerTrackingMap from "../components/customer/CustomerTrackingMap";

const OrderDetails = () => {
      const { id } = useParams();
      const { socket } = useSocket();

      const [order, setOrder] = useState<IOrder | null>(null);
      const [loading, setLoading] = useState(true);

      const fetchOrder = useCallback(async () => {
            if (!id) return;
            try {
                  const { data } = await axios.get(`${orderBaseUrl}/my-orders/${id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                        withCredentials: true
                  });
                  setOrder(data.data);
            } catch (error) {
                  console.log(error);
            } finally {
                  setLoading(false);
            }
      }, [id]);

      useEffect(() => {
            fetchOrder();
      }, [fetchOrder]);

      useEffect(() => {
            if (!socket) return;

            const handleOrderUpdate = ({ orderId }: { orderId: string }) => {
                  if (orderId === id) fetchOrder();
            };

            socket.on("order:update", handleOrderUpdate);
            socket.on("order:rider_assigned", handleOrderUpdate);

            return () => {
                  socket.off("order:update", handleOrderUpdate);
                  socket.off("order:rider_assigned", handleOrderUpdate);
            };
      }, [id, socket, fetchOrder]);

      if (loading) return (
            <div className="container-app py-6 space-y-4">
                  <div className="space-y-1">
                        <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-28 bg-gray-200 rounded-full animate-pulse" />
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="flex items-center gap-2">
                              {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                          <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse shrink-0" />
                                          {i < 4 && <div className="h-1 w-8 bg-gray-200 rounded animate-pulse" />}
                                    </div>
                              ))}
                        </div>
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex justify-between items-center">
                                    <div className="space-y-1">
                                          <div className="h-3.5 w-36 bg-gray-200 rounded animate-pulse" />
                                          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                    <div className="h-3.5 w-14 bg-gray-200 rounded animate-pulse" />
                              </div>
                        ))}
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                        {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex justify-between">
                                    <div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse" />
                              </div>
                        ))}
                        <div className="pt-3 border-t border-gray-100 flex justify-between">
                              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        </div>
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-2">
                        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3.5 w-64 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3.5 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
            </div>
      );

      if (!order) return (
            <div className="container-app py-6 flex justify-center items-center h-72">
                  <p className="text-gray-400 text-sm">Order not found.</p>
            </div>
      );

      const STATUS_LABEL: Record<string, string> = {
            placed: "Placed", accepted: "Accepted", preparing: "Preparing",
            ready_for_rider: "Ready for Rider", rider_assigned: "Rider Assigned",
            picked_up: "Picked Up", delivered: "Delivered", cancelled: "Cancelled",
      };

      const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
      });

      return (
            <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-3">

                  <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                              <h1 className="text-lg font-bold text-gray-800 truncate">{order.restaurantName}</h1>
                              <p className="text-xs text-gray-400 mt-0.5">#{order._id.slice(-8).toUpperCase()} · {date}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                    Order Status: <span className="font-semibold">{STATUS_LABEL[order.status] ?? order.status}</span>
                              </p>
                        </div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-700">Order Status</p>
                        <span className="font-semibold">{STATUS_LABEL[order.status] ?? order.status}</span>
                  </div>

                  <CustomerTrackingMap order={order} />

                  {order.riderName && (
                        <div className="border border-gray-100 rounded-2xl p-4 bg-white flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-700">Your Rider</p>
                                    <p className="text-sm text-gray-500 mt-0.5 truncate">{order.riderName}</p>
                              </div>
                              {order.riderPhoneNumber && order.status !== "delivered" && (
                                    <a
                                          href={`tel:${order.riderPhoneNumber}`}
                                          className="shrink-0 flex items-center gap-1.5 text-sm text-blue-600 font-medium"
                                    >
                                          <Phone size={14} />
                                          <span className="hidden sm:inline">{order.riderPhoneNumber}</span>
                                          <span className="sm:hidden">Call</span>
                                    </a>
                              )}
                        </div>
                  )}

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Items</p>
                        {order.items.map((item) => (
                              <div key={item.itemId} className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                          <p className="text-sm text-gray-700 truncate">{item.name}</p>
                                          <p className="text-xs text-gray-400">x{item.quantity} · ₹{item.price} each</p>
                                    </div>
                                    <p className="shrink-0 text-sm font-medium text-gray-700">₹{item.price * item.quantity}</p>
                              </div>
                        ))}
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Bill Summary</p>
                        {([
                              ["Subtotal", `₹${order.subtotal}`],
                              ["Delivery Fee", `₹${order.deliveryFee}`],
                              ["Platform Fee", `₹${order.platformFee}`],
                              ["GST", `₹${(order.totalAmount - order.subtotal - order.deliveryFee - order.platformFee).toFixed(2)}`],
                        ] as [string, string][]).map(([label, value]) => (
                              <div key={label} className="flex justify-between text-sm text-gray-500">
                                    <span>{label}</span><span>{value}</span>
                              </div>
                        ))}
                        <div className="pt-2 border-t border-gray-100 flex justify-between">
                              <span className="font-semibold text-gray-800">Total</span>
                              <span className="font-bold text-gray-800">₹{order.totalAmount}</span>
                        </div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Delivery Address</p>
                        <div className="flex items-start gap-2 text-sm text-gray-500">
                              <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
                              <span className="wrap-break-word">{order.deliveryAddress.formatedAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone size={15} className="shrink-0 text-gray-400" />
                              <span>{order.deliveryAddress.mobile}</span>
                        </div>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white flex justify-between items-center gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                              {order.paymentMethod === "razorpay"
                                    ? <Wallet size={18} className="text-gray-400 shrink-0" />
                                    : <CreditCard size={18} className="text-gray-400 shrink-0" />
                              }
                              <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-700">Payment By</p>
                                    <p className="text-xs text-gray-400 capitalize mt-0.5 truncate">{order.paymentMethod}</p>
                              </div>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              order.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                              order.paymentStatus === "failed" ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700"
                        }`}>
                              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                  </div>

                  <div className="border border-gray-100 rounded-2xl p-4 bg-white flex items-center gap-3">
                        <Store size={18} className="text-gray-400 shrink-0" />
                        <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-700 truncate">{order.restaurantName}</p>
                              <p className="text-xs text-gray-400">{order.distance} km away</p>
                        </div>
                  </div>
            </div>
      );
};

export default OrderDetails;