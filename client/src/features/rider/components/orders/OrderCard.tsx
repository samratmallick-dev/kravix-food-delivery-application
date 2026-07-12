import { memo } from "react";
import { CheckCircle2, XCircle, MapPin, IndianRupee } from "lucide-react";
import type { IOrder } from "@/types";
import { useNavigate } from "react-router-dom";

interface OrderCardProps {
  order: IOrder;
}

const statusStyle: Record<string, string> = {
  delivered:  "bg-green-50 text-green-700 ring-green-200",
  cancelled:  "bg-red-50 text-red-700 ring-red-200",
  placed:     "bg-amber-50 text-amber-700 ring-amber-200",
  accepted:   "bg-blue-50 text-blue-700 ring-blue-200",
  preparing:  "bg-purple-50 text-purple-700 ring-purple-200",
};

const OrderCard = memo(({ order }: OrderCardProps) => {
  const navigate = useNavigate();
  const style = statusStyle[order.status] ?? "bg-gray-50 text-gray-700 ring-gray-200";
  const isDelivered = order.status === "delivered";

  return (
    <div
      onClick={() => navigate(`/rider/orders/${order._id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-(--shadow-sm) p-4 space-y-3 cursor-pointer hover:shadow-(--shadow-md) transition-shadow active:scale-[0.99]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/rider/orders/${order._id}`)}
      aria-label={`Order from ${order.restaurantName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-800 text-sm">{order.restaurantName}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">#{order._id.slice(-8).toUpperCase()}</p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ring-1 shrink-0 ${style}`}>
          {isDelivered ? <CheckCircle2 size={11} /> : order.status === "cancelled" ? <XCircle size={11} /> : null}
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-500">
        <MapPin size={11} className="mt-0.5 shrink-0 text-gray-400" />
        <span className="line-clamp-1">{order.deliveryAddress?.formatedAddress}</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100">
        <span className="text-xs text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-1 text-sm font-bold text-green-600">
          <IndianRupee size={12} />{order.riderAmount}
        </div>
      </div>
    </div>
  );
});

OrderCard.displayName = "OrderCard";
export default OrderCard;
