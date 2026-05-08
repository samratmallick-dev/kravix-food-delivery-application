import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import type { IOrder } from "../types/types";
import { useEffect, useCallback, useState, useRef } from "react";
import axios from "axios";
import { orderBaseUrl } from "../components/common/constant";
import { useAppData } from "../context/AppContext";
import toast from "react-hot-toast";
import {
      MapPin, Phone, Store, CreditCard, Wallet,
      CheckCircle2, ChefHat, UtensilsCrossed, Bike, PackageCheck,
      Clock, ClipboardList, KeyRound, Star, RotateCcw
} from "lucide-react";
import CustomerTrackingMap from "../components/customer/CustomerTrackingMap";
import confetti from "canvas-confetti";

const STEPS = [
      { key: "placed",           label: "Placed",       Icon: ClipboardList },
      { key: "accepted",         label: "Accepted",     Icon: CheckCircle2 },
      { key: "preparing",        label: "Preparing",    Icon: ChefHat },
      { key: "ready_for_rider",  label: "Ready",        Icon: UtensilsCrossed },
      { key: "rider_assigned",   label: "Rider",        Icon: Bike },
      { key: "picked_up",        label: "Picked Up",    Icon: Bike },
      { key: "out_for_delivery", label: "On the Way",   Icon: Bike },
      { key: "reached_delivery_location", label: "Arrived", Icon: MapPin },
      { key: "delivered",        label: "Delivered",    Icon: PackageCheck },
] as const;

const DISPLAY_STEPS = [
      { keys: ["placed"],                                    label: "Placed",      Icon: ClipboardList },
      { keys: ["accepted"],                                  label: "Accepted",    Icon: CheckCircle2 },
      { keys: ["preparing", "ready_for_rider"],              label: "Preparing",   Icon: ChefHat },
      { keys: ["rider_assigned", "picked_up"],               label: "Picked Up",   Icon: Bike },
      { keys: ["out_for_delivery", "reached_delivery_location"], label: "On the Way", Icon: Bike },
      { keys: ["delivered"],                                 label: "Delivered",   Icon: PackageCheck },
] as const;

const STATUS_ORDER = STEPS.map((s) => s.key);

const STATUS_LABEL: Record<string, string> = {
      placed: "Order Placed",
      accepted: "Accepted by Restaurant",
      preparing: "Being Prepared",
      ready_for_rider: "Ready for Pickup",
      rider_assigned: "Rider Assigned",
      picked_up: "Picked Up",
      out_for_delivery: "Out for Delivery",
      reached_delivery_location: "Rider Arrived",
      delivered: "Delivered 🎉",
      cancelled: "Cancelled",
};

const calcEta = (distanceKm: number): string => {
      const mins = Math.round(3 + distanceKm * 2);
      if (mins < 60) return `~${mins} min`;
      return `~${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const StatusStepper = ({ status }: { status: string }) => {
      const currentIdx = STATUS_ORDER.indexOf(status as any);
      const isCancelled = status === "cancelled";

      if (isCancelled) {
            return (
                  <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                        <span className="text-2xl">❌</span>
                        <div>
                              <p className="font-semibold text-red-700">Order Cancelled</p>
                              <p className="text-xs text-red-400 mt-0.5">This order has been cancelled.</p>
                        </div>
                  </div>
            );
      }

      return (
            <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Order Progress</p>
                  <div className="flex items-center gap-0">
                        {DISPLAY_STEPS.map((step, i) => {
                              const stepMaxIdx = Math.max(...step.keys.map((k) => STATUS_ORDER.indexOf(k as any)));
                              const isDone = currentIdx >= stepMaxIdx;
                              const isActive = step.keys.some((k) => k === status) ||
                                    (currentIdx >= STATUS_ORDER.indexOf(step.keys[0] as any) && currentIdx <= stepMaxIdx);
                              const { Icon } = step;

                              return (
                                    <div key={step.label} className="flex items-center flex-1 min-w-0">
                                          <div className="flex flex-col items-center gap-1 shrink-0">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${isDone
                                                            ? "bg-primary text-white shadow-md shadow-primary/30"
                                                            : isActive
                                                                  ? "bg-primary/10 text-primary ring-2 ring-primary ring-offset-1"
                                                                  : "bg-gray-100 text-gray-300"
                                                      }`}>
                                                      <Icon size={16} className={isActive && !isDone ? "animate-pulse" : ""} />
                                                </div>
                                                <span className={`text-[9px] font-semibold text-center leading-tight max-w-12 ${isDone ? "text-primary" : isActive ? "text-primary/70" : "text-gray-300"}`}>
                                                      {step.label}
                                                </span>
                                          </div>
                                          {i < DISPLAY_STEPS.length - 1 && (
                                                <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all duration-700 ${isDone ? "bg-primary" : "bg-gray-100"}`} />
                                          )}
                                    </div>
                              );
                        })}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 text-center pt-1">
                        {STATUS_LABEL[status] ?? status}
                  </p>
            </div>
      );
};

const RiderCard = ({ order }: { order: IOrder }) => {
      const isActive = !["delivered", "cancelled"].includes(order.status);
      const showFab = ["out_for_delivery", "reached_delivery_location", "picked_up"].includes(order.status);

      return (
            <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Rider</p>
                  <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0 ring-2 ring-primary/20">
                              <Bike size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{order.riderName}</p>
                              <p className="text-xs text-gray-400">{order.riderPhoneNumber}</p>
                              {isActive && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                          <Clock size={11} className="text-primary shrink-0" />
                                          <span className="text-xs font-medium text-primary">ETA {calcEta(order.distance)}</span>
                                          <span className="flex items-center gap-0.5 ml-1">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                      <Star key={s} size={9} className={s <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
                                                ))}
                                          </span>
                                    </div>
                              )}
                        </div>
                        
                        {showFab && order.riderPhoneNumber && (
                              <a
                                    href={`tel:${order.riderPhoneNumber}`}
                                    className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 hover:bg-red-700 transition-all active:scale-95 shrink-0"
                                    aria-label="Call rider"
                              >
                                    <Phone size={18} className="text-white" />
                              </a>
                        )}
                  </div>
            </div>
      );
};

const OtpBanner = ({ otp }: { otp: string }) => (
      <div className="bg-indigo-50/90 backdrop-blur-sm border border-indigo-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <KeyRound size={18} className="text-indigo-600" />
            </div>
            <div>
                  <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Delivery OTP</p>
                  <p className="text-2xl font-bold tracking-[0.3em] text-indigo-800 font-mono">{otp}</p>
                  <p className="text-xs text-indigo-400 mt-0.5">Share this code with your rider to confirm delivery</p>
            </div>
      </div>
);

const OrderDetails = () => {
      const { id } = useParams();
      const { socket } = useSocket();
      const { fetchCart } = useAppData();
      const navigate = useNavigate();

      const [order, setOrder] = useState<IOrder | null>(null);
      const [loading, setLoading] = useState(true);
      const [deliveryOtp, setDeliveryOtp] = useState<string | null>(null);
      const [isReordering, setIsReordering] = useState(false);

      const prevStatusRef = useRef<string | null>(null);
      const confettiFiredRef = useRef(false);

      const fetchOrder = useCallback(async () => {
            if (!id) return;
            try {
                  const { data } = await axios.get(`${orderBaseUrl}/me/${id}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                        withCredentials: true,
                  });
                  setOrder(data.data);
                  
                  if (data.data?.deliveryOtp && data.data?.status === "reached_delivery_location") {
                        setDeliveryOtp(data.data.deliveryOtp);
                  }
            } catch (error) {
                  console.log(error);
            } finally {
                  setLoading(false);
            }
      }, [id]);

      useEffect(() => { fetchOrder(); }, [fetchOrder]);

      const handleReorder = async () => {
            if (!order) return;
            setIsReordering(true);
            try {
                  const { data } = await axios.post(
                        `${orderBaseUrl}/reorder/${order._id}`,
                        {},
                        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                  );
                  await fetchCart();
                  toast.success(data.message);
                  navigate("/cart");
            } catch (err: any) {
                  toast.error(err?.response?.data?.message ?? "Failed to reorder. Please try again.");
            } finally {
                  setIsReordering(false);
            }
      };

      useEffect(() => {
            if (!order) return;
            const hasJustDelivered = prevStatusRef.current !== null && prevStatusRef.current !== "delivered" && order.status === "delivered";
            if (hasJustDelivered && !confettiFiredRef.current) {
                  confettiFiredRef.current = true;
                  const fire = (particleRatio: number, opts: confetti.Options) =>
                        confetti({ origin: { y: 0.6 }, ...opts, particleCount: Math.floor(200 * particleRatio) });
                  fire(0.25, { spread: 26, startVelocity: 55 });
                  fire(0.2, { spread: 60 });
                  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
                  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
                  fire(0.1, { spread: 120, startVelocity: 45 });
            }
            prevStatusRef.current = order.status;
      }, [order?.status]);

      useEffect(() => {
            if (!socket) return;

            const handleOrderUpdate = ({ orderId, status, riderName, riderPhoneNumber }: {
                  orderId: string; status?: string; riderName?: string; riderPhoneNumber?: string;
            }) => {
                  if (orderId !== id) return;
                  if (status) {
                        setOrder((prev) => prev ? {
                              ...prev,
                              status: status as IOrder["status"],
                              ...(riderName ? { riderName } : {}),
                              ...(riderPhoneNumber ? { riderPhoneNumber: riderPhoneNumber as any } : {}),
                        } : prev);
                  } else {
                        fetchOrder();
                  }
            };

            const handleDeliveryOtp = ({ otp }: { otp: string }) => {
                  setDeliveryOtp(otp);
            };

            socket.on("order:update", handleOrderUpdate);
            socket.on("delivery:otp", handleDeliveryOtp);

            return () => {
                  socket.off("order:update", handleOrderUpdate);
                  socket.off("delivery:otp", handleDeliveryOtp);
            };
      }, [id, socket, fetchOrder]);

      if (loading) return (
            <div className="container-app py-6 space-y-4 max-w-2xl mx-auto">
                  <div className="space-y-1">
                        <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="flex items-center gap-2">
                              {[...Array(6)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-1 flex-1">
                                          <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse shrink-0" />
                                          {i < 5 && <div className="flex-1 h-0.5 bg-gray-200 rounded animate-pulse" />}
                                    </div>
                              ))}
                        </div>
                  </div>
                  <div className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
                  {[...Array(3)].map((_, i) => (
                        <div key={i} className="border border-gray-100 rounded-2xl p-4 bg-white space-y-3">
                              <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                              {[...Array(2)].map((_, j) => (
                                    <div key={j} className="flex justify-between">
                                          <div className="h-3.5 w-32 bg-gray-200 rounded animate-pulse" />
                                          <div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse" />
                                    </div>
                              ))}
                        </div>
                  ))}
            </div>
      );

      if (!order) return (
            <div className="container-app py-6 flex justify-center items-center h-72">
                  <p className="text-gray-400 text-sm">Order not found.</p>
            </div>
      );

      const date = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const gst = +(order.totalAmount - order.subtotal - order.deliveryFee - order.platformFee).toFixed(2);

      return (
            <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-3">

                  <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                              <h1 className="text-lg font-bold text-gray-800 truncate">{order.restaurantName}</h1>
                              <p className="text-xs text-gray-400 mt-0.5">#{order._id.slice(-8).toUpperCase()} · {date}</p>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : order.paymentStatus === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                  </div>

                  <StatusStepper status={order.status} />

                  {deliveryOtp && order.status === "reached_delivery_location" && (
                        <OtpBanner otp={deliveryOtp} />
                  )}

                  <CustomerTrackingMap order={order} />

                  {order.riderName && <RiderCard order={order} />}

                  <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Items</p>
                        {order.items.map((item) => (
                              <div key={item.itemId} className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                          <p className="text-sm text-gray-700 truncate">{item.name}</p>
                                          <p className="text-xs text-gray-400">×{item.quantity} · ₹{item.price} each</p>
                                    </div>
                                    <p className="shrink-0 text-sm font-semibold text-gray-700">₹{item.price * item.quantity}</p>
                              </div>
                        ))}
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bill Summary</p>
                        {([
                              ["Subtotal", `₹${order.subtotal}`],
                              ["Delivery Fee", order.deliveryFee === 0 ? "FREE 🎉" : `₹${order.deliveryFee}`],
                              ["Platform Fee", `₹${order.platformFee}`],
                              ["GST", `₹${gst}`],
                        ] as [string, string][]).map(([label, value]) => (
                              <div key={label} className="flex justify-between text-sm text-gray-500">
                                    <span>{label}</span>
                                    <span className={value.includes("FREE") ? "text-green-600 font-semibold" : ""}>{value}</span>
                              </div>
                        ))}
                        <div className="pt-2 border-t border-gray-100 flex justify-between">
                              <span className="font-bold text-gray-800">Total</span>
                              <span className="font-bold text-gray-800">₹{order.totalAmount}</span>
                        </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm space-y-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Delivery Address</p>
                        <div className="flex items-start gap-2 text-sm text-gray-500">
                              <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
                              <span className="break-words">{order.deliveryAddress.formatedAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone size={15} className="shrink-0 text-gray-400" />
                              <span>{order.deliveryAddress.mobile}</span>
                        </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                              {order.paymentMethod === "razorpay"
                                    ? <Wallet size={18} className="text-gray-400 shrink-0" />
                                    : <CreditCard size={18} className="text-gray-400 shrink-0" />
                              }
                              <div className="min-w-0">
                                    <p className="text-xs text-gray-400">Payment</p>
                                    <p className="text-sm font-semibold text-gray-700 capitalize truncate">{order.paymentMethod}</p>
                              </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                              <Store size={18} className="text-gray-400 shrink-0" />
                              <div className="min-w-0">
                                    <p className="text-xs text-gray-400">Restaurant</p>
                                    <p className="text-sm font-semibold text-gray-700 truncate">{order.restaurantName}</p>
                                    <p className="text-xs text-gray-400">{order.distance} km away</p>
                              </div>
                        </div>
                  </div>

                  {order.status === "delivered" && (
                        <button
                              onClick={handleReorder}
                              disabled={isReordering}
                              className="group w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-primary to-red-600 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                        >
                              {isReordering
                                    ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    : <RotateCcw size={18} className="group-hover:rotate-[-45deg] transition-transform duration-300" />
                              }
                              {isReordering ? "Adding to Cart..." : "Reorder"}
                        </button>
                  )}

            </div>
      );
};

export default OrderDetails;
