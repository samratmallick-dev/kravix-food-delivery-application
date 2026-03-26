import { useState } from "react";
import { Loader2, MapPin, Phone } from "lucide-react";
import type { IOrder } from "../../types/types";

const RIDER_STATUS_LABEL: Record<string, string> = {
      rider_assigned: "Rider Assigned — Head to restaurant",
      picked_up: "Picked Up — On the way",
      out_for_delivery: "Out for Delivery",
      reached_delivery_location: "Reached Location — Confirm delivery",
      delivered: "Delivered",
};

const RIDER_NEXT_ACTION: Record<string, string | null> = {
      rider_assigned: "Confirm Pick-Up",
      picked_up: "Start Delivery",
      out_for_delivery: "Confirm Reached Location",
      reached_delivery_location: "Confirm Delivery",
      delivered: null,
};

const CurrentOrderCard = ({
      order,
      onStatusUpdate,
}: {
      order: IOrder;
      onStatusUpdate: () => Promise<void>;
}) => {
      const [updating, setUpdating] = useState(false);
      const label = RIDER_STATUS_LABEL[order.status] ?? order.status.replace(/_/g, " ");
      const actionLabel = RIDER_NEXT_ACTION[order.status] ?? null;

      return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                        <div>
                              <p className="font-bold text-gray-800">{order.restaurantName}</p>
                              <p className="text-xs text-gray-400 font-mono mt-0.5">#{order._id.slice(-8).toUpperCase()}</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ring-1 text-center max-w-35 sm:max-w-none ${
                                    order.status === "rider_assigned"
                                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                                          : "bg-indigo-50 text-indigo-700 ring-indigo-200"
                              }`}>
                              {label}
                        </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                        {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-gray-700">
                                    <span>{item.quantity}× {item.name}</span>
                                    <span className="tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                        ))}
                  </div>

                  <div className="flex items-start gap-2 text-sm text-gray-500">
                        <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                        <span>{order.deliveryAddress.formatedAddress}</span>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone size={14} className="text-primary shrink-0" />
                              <div>
                                    <p className="text-xs text-gray-400">Customer</p>
                                    <p className="font-medium">{order.deliveryAddress.customerName}</p>
                                    <p className="text-xs text-gray-500">{order.deliveryAddress.mobile}</p>
                              </div>
                        </div>
                        <a
                              href={`tel:${order.deliveryAddress.mobile}`}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-red-700 transition"
                        >
                              Call
                        </a>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-gray-800 pt-1 border-t border-dashed border-gray-200">
                        <span>Rider Earnings</span>
                        <span>₹{order.riderAmount}</span>
                  </div>

                  {actionLabel && (
                        <button
                              disabled={updating}
                              onClick={async () => {
                                    setUpdating(true);
                                    try {
                                          await onStatusUpdate();
                                    } finally {
                                          setUpdating(false);
                                    }
                              }}
                              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl bg-primary text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                              {updating ? <Loader2 size={16} className="animate-spin" /> : actionLabel}
                        </button>
                  )}
            </div>
      );
};

export default CurrentOrderCard;
