import { memo } from "react";
import { CheckCircle2, Circle, Bike, MapPin, Package, Home, Star } from "lucide-react";
import type { IOrder } from "../../../types/types";

const TIMELINE_STEPS: { status: IOrder["status"]; label: string; icon: React.ReactNode }[] = [
  { status: "rider_assigned",            label: "Order Assigned",       icon: <Bike size={14} /> },
  { status: "picked_up",                 label: "Picked Up",            icon: <Package size={14} /> },
  { status: "out_for_delivery",          label: "Out for Delivery",     icon: <MapPin size={14} /> },
  { status: "reached_delivery_location", label: "Reached Location",     icon: <Home size={14} /> },
  { status: "delivered",                 label: "Delivered",            icon: <Star size={14} /> },
];

const ORDER_RANK: Record<string, number> = {
  rider_assigned: 0, ready_for_rider: 0,
  picked_up: 1, out_for_delivery: 2,
  reached_delivery_location: 3, delivered: 4,
};

interface DeliveryTimelineProps { order: IOrder; }

const DeliveryTimeline = memo(({ order }: DeliveryTimelineProps) => {
  const currentRank = ORDER_RANK[order.status] ?? -1;

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
      <div className="space-y-4">
        {TIMELINE_STEPS.map(({ status, label, icon }, idx) => {
          const done = idx <= currentRank;
          const active = idx === currentRank;
          return (
            <div key={status} className="flex items-center gap-3 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${done ? "bg-primary text-white" : "bg-gray-100 text-gray-400"} ${active ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}>
                {done && idx < currentRank ? <CheckCircle2 size={14} /> : icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${done ? "text-gray-800" : "text-gray-400"}`}>{label}</p>
                {active && <p className="text-xs text-primary font-medium">Current step</p>}
              </div>
              {done && idx < currentRank && <Circle size={8} className="text-green-500 fill-green-500 shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
});

DeliveryTimeline.displayName = "DeliveryTimeline";
export default DeliveryTimeline;
