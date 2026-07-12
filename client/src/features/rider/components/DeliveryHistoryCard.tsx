import { CheckCircle2, MapPin } from "lucide-react";
import type { IOrder } from "@/types";

const DeliveryHistoryCard = ({ order }: { order: IOrder }) => (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                  <div>
                        <p className="font-bold text-gray-800 text-sm">{order.restaurantName}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">#{order._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200 shrink-0">
                        <CheckCircle2 size={12} /> Delivered
                  </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
                  {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-gray-700">
                              <span>{item.quantity}× {item.name}</span>
                              <span className="tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                  ))}
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin size={12} className="mt-0.5 shrink-0 text-gray-400" />
                  <span>{order.deliveryAddress.formatedAddress}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-gray-800 pt-1 border-t border-dashed border-gray-200">
                  <span>Earned</span>
                  <span className="text-green-600">₹{order.riderAmount}</span>
            </div>
      </div>
);

export default DeliveryHistoryCard;
