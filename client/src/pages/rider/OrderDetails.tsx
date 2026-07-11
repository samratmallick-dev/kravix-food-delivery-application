import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, IndianRupee, Package } from "lucide-react";
import type { IOrder } from "../../types/types";
import { useDeliveryHistory } from "../../hooks/useDeliveryHistory";
import DeliveryTimeline from "../../components/rider/orders/DeliveryTimeline";
import DashboardCard from "../../components/ui/DashboardCard";
import { OrdersSkeleton } from "../../components/skeleton/RiderSkeletons";

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { history, loading, fetchHistory } = useDeliveryHistory();
  const [order, setOrder] = useState<IOrder | null>(null);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    if (history.length && id) {
      setOrder(history.find((o) => o._id === id) ?? null);
    }
  }, [history, id]);

  if (loading) return <OrdersSkeleton />;

  if (!order) return (
    <div className="rider-page-enter space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition">
        <ArrowLeft size={16} /> Back
      </button>
      <p className="text-center text-gray-500 py-12">Order not found</p>
    </div>
  );

  return (
    <div className="space-y-4 rider-page-enter">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition">
        <ArrowLeft size={16} /> Back to Orders
      </button>

      {/* Header */}
      <DashboardCard className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-800">{order.restaurantName}</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">#{order._id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ${order.status === "delivered" ? "bg-green-50 text-green-700 ring-green-200" : order.status === "cancelled" ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </div>
      </DashboardCard>

      {/* Timeline */}
      <DashboardCard className="p-5">
        <p className="text-sm font-bold text-gray-800 mb-4">Delivery Timeline</p>
        <DeliveryTimeline order={order} />
      </DashboardCard>

      {/* Items */}
      <DashboardCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Package size={15} className="text-gray-500" />
          <p className="text-sm font-bold text-gray-800">Order Items</p>
        </div>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-gray-700">
              <span>{item.quantity}× {item.name}</span>
              <span className="tabular-nums font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-sm font-bold text-gray-800">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>
      </DashboardCard>

      {/* Delivery address */}
      <DashboardCard className="p-5 space-y-3">
        <p className="text-sm font-bold text-gray-800">Delivery Details</p>
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
          <span>{order.deliveryAddress?.formatedAddress}</span>
        </div>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-primary shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Customer</p>
              <p className="text-sm font-medium text-gray-800">{order.deliveryAddress?.customerName}</p>
              <p className="text-xs text-gray-500">{order.deliveryAddress?.mobile}</p>
            </div>
          </div>
          <a href={`tel:${order.deliveryAddress?.mobile}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-red-700 transition"
          >
            Call
          </a>
        </div>
      </DashboardCard>

      {/* Earnings */}
      <DashboardCard className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IndianRupee size={14} className="text-green-500" />
            <span>Rider Earnings</span>
          </div>
          <span className="text-base font-bold text-green-600">₹{order.riderAmount}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">Payment Method</span>
          <span className="text-xs font-semibold text-gray-700 uppercase">{order.paymentMethod}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">Distance</span>
          <span className="text-xs font-semibold text-gray-700">{order.distance?.toFixed(1)} km</span>
        </div>
      </DashboardCard>
    </div>
  );
};

export default OrderDetails;
