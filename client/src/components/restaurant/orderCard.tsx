import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../../types/types";
import { ORDER_ACTION } from "../../utils/orderFlow";
import { updateOrderStatus } from "../../utils/order.api";
import toast from "react-hot-toast";
import { MapPin, CreditCard, ChevronRight, Loader2, RefreshCw, Bike, Phone } from "lucide-react";

interface props {
      order: IOrder;
      onStatusUpdate: (orderId: string, newStatus: IOrder["status"]) => void;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
      placed: {
            label: "Placed",
            dot: "bg-amber-400",
            badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      },
      accepted: {
            label: "Accepted",
            dot: "bg-orange-400",
            badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
      },
      preparing: {
            label: "Preparing",
            dot: "bg-blue-400",
            badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      },
      ready_for_rider: {
            label: "Ready for Rider",
            dot: "bg-violet-400",
            badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
      },
      rider_assigned: {
            label: "Rider Assigned",
            dot: "bg-indigo-400",
            badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
      },
      picked_up: {
            label: "Picked Up",
            dot: "bg-purple-400",
            badge: "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
      },
      delivered: {
            label: "Delivered",
            dot: "bg-emerald-400",
            badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      },
};

const PAYMENT_STATUS_STYLE: Record<string, string> = {
      paid: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      failed: "bg-red-50 text-red-600 ring-1 ring-red-200",
      pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

const OrderCard = ({ order, onStatusUpdate }: props) => {
      const [loading, setLoading] = useState(false);
      const [retryVisible, setRetryVisible] = useState(false);
      const prevStatusRef = useRef<string | null>(null);
      const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

      useEffect(() => {
            const prevStatus = prevStatusRef.current;
            prevStatusRef.current = order.status;
            if (order.status === "ready_for_rider" && prevStatus !== "ready_for_rider") {
                  setRetryVisible(false);
                  if (timerRef.current) clearTimeout(timerRef.current);
                  timerRef.current = setTimeout(() => setRetryVisible(true), 10000);
            }

            if (order.status !== "ready_for_rider") {
                  setRetryVisible(false);
                  if (timerRef.current) clearTimeout(timerRef.current);
            }

            return () => {
                  if (timerRef.current) clearTimeout(timerRef.current);
            };
      }, [order.status]);

      const action = ORDER_ACTION[order.status as keyof typeof ORDER_ACTION] || [];
      const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, dot: "bg-gray-400", badge: "bg-gray-50 text-gray-600 ring-1 ring-gray-200" };

      const updateStatus = async (status: string) => {
            try {
                  setLoading(true);
                  setRetryVisible(false);
                  if (timerRef.current) clearTimeout(timerRef.current);
                  const res = await updateOrderStatus(order._id, status);
                  toast.success(res.message || "Order status updated successfully");
                  onStatusUpdate(order._id, status as IOrder["status"]);
                  if (status === "ready_for_rider") {
                        timerRef.current = setTimeout(() => setRetryVisible(true), 10000);
                  }
            } catch (error: any) {
                  const message = error.message || "Failed to update order status";
                  toast.error(message);
            } finally {
                  setLoading(false);
            }
      };

      return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] transition-shadow duration-300 overflow-hidden">

                  <div className={`h-1 w-full ${statusCfg.dot}`} />

                  <div className="p-5 space-y-4">

                        <div className="flex items-start justify-between gap-3">
                              <div>
                                    <p className="text-base font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Order ID: <span className="font-bold text-gray-800 font-mono">#{order._id.slice(-8).toUpperCase()}</span></p>
                                    <p className="text-xs text-gray-400 mt-0.5">{order.items.reduce((sum, i) => sum + i.quantity, 0)} items</p>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} animate-pulse`} />
                                    {statusCfg.label}
                              </span>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
                              {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                          <div className="flex items-center gap-2 text-gray-700">
                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-orange-100 text-orange-600 text-[10px] font-bold shrink-0">
                                                      {item.quantity}
                                                </span>
                                                <span className="font-medium">{item.name}</span>
                                          </div>
                                          <span className="text-gray-500 font-medium tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                              ))}
                        </div>

                        <div className="space-y-1.5 text-sm">
                              <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">₹{order.subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                    <span>Delivery fee</span>
                                    <span className="tabular-nums">₹{order.deliveryFee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                    <span>Platform fee</span>
                                    <span className="tabular-nums">₹{order.platformFee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                    <span>GST</span>
                                    <span className="tabular-nums">₹{(order.subtotal * 0.05 + order.deliveryFee * 0.18).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-gray-800 pt-1.5 border-t border-dashed border-gray-200 mt-1.5">
                                    <span>Total</span>
                                    <span className="tabular-nums">₹{order.totalAmount.toFixed(2)}</span>
                              </div>
                        </div>

                        {order.riderName && (
                              <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3.5 py-2.5">
                                    <Bike size={14} className="text-primary shrink-0" />
                                    <div className="flex flex-col">
                                          <span className="text-xs font-semibold text-primary">{order.riderName}</span>
                                          {order.riderPhoneNumber && (
                                                <span className="flex items-center gap-1 text-[11px] text-primary/70">
                                                      <Phone size={10} />{order.riderPhoneNumber}
                                                </span>
                                          )}
                                    </div>
                              </div>
                        )}

                        <div className="flex flex-col gap-2 pt-1">
                              <div className="flex items-start gap-1.5 text-xs text-gray-500">
                                    <MapPin size={12} className="mt-0.5 shrink-0 text-gray-400" />
                                    <span className="leading-snug">{order.deliveryAddress.formatedAddress}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                    <CreditCard size={12} className="text-gray-400 shrink-0" />
                                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize bg-gray-100 text-gray-600">
                                          {order.paymentMethod}
                                    </span>
                                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${PAYMENT_STATUS_STYLE[order.paymentStatus] ?? "bg-gray-50 text-gray-600 ring-1 ring-gray-200"}`}>
                                          {order.paymentStatus}
                                    </span>
                              </div>
                        </div>

                        {action.length > 0 && (
                              <div className="flex gap-2 pt-1">
                                    {action.map((status) => (
                                          <button
                                                key={status}
                                                onClick={() => updateStatus(status)}
                                                disabled={loading}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 group shadow-sm hover:shadow-md"
                                          >
                                                {loading ? (
                                                      <>
                                                            <Loader2 size={14} className="animate-spin" />
                                                            Updating…
                                                      </>
                                                ) : (
                                                      <>
                                                            Mark as {status.replace(/_/g, " ")}
                                                            <ChevronRight size={14} />
                                                      </>
                                                )}
                                          </button>
                                    ))}
                              </div>
                        )}
                        {
                              order.status === "ready_for_rider" && retryVisible && (
                                    <button
                                          onClick={() => updateStatus("ready_for_rider")}
                                          disabled={loading}
                                          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl border-2 border-violet-400 text-violet-600 hover:bg-violet-50 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                                    >
                                          {loading ? <Loader2 size={14} className="animate-spin" /> : <><RefreshCw size={14} /> Retry Rider Assignment</>}
                                    </button>
                              )
                        }
                  </div>
            </div>
      );
};

export default OrderCard;
