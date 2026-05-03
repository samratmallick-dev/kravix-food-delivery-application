import { Loader2, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import type { ActiveDelivery } from "../../types/rider.types";
import { DeliveryStep } from "../../types/rider.types";

interface Props {
  delivery: ActiveDelivery;
  onStepUpdate: () => Promise<void>;
}

const STEPS: { key: DeliveryStep; label: string }[] = [
  { key: DeliveryStep.RIDER_ASSIGNED, label: "Assigned" },
  { key: DeliveryStep.PICKED_UP, label: "Picked Up" },
  { key: DeliveryStep.OUT_FOR_DELIVERY, label: "On The Way" },
  { key: DeliveryStep.REACHED, label: "Arrived" },
  { key: DeliveryStep.DELIVERED, label: "Delivered" },
];

const NEXT_ACTION: Partial<Record<DeliveryStep, string>> = {
  [DeliveryStep.RIDER_ASSIGNED]: "Pick Up Order",
  [DeliveryStep.PICKED_UP]: "Start Delivery",
  [DeliveryStep.OUT_FOR_DELIVERY]: "Mark Arrived",
  [DeliveryStep.REACHED]: "Complete Delivery",
};

const DeliveryStepperCard = ({ delivery, onStepUpdate }: Props) => {
  const [updating, setUpdating] = useState(false);
  const currentIdx = STEPS.findIndex((s) => s.key === delivery.status);
  const actionLabel = NEXT_ACTION[delivery.status];

  return (
    <div className="bg-[#2C2C2A] border border-[#3a3a37] rounded-2xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-semibold">{delivery.restaurantName}</p>
          <p className="text-[#888884] text-xs font-mono mt-0.5">
            #{delivery._id.slice(-8).toUpperCase()}
          </p>
        </div>
        <span className="text-[#EF9F27] font-mono font-bold text-sm">
          ₹{delivery.riderAmount}
        </span>
      </div>

      {/* Stepper */}
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-[#444441]" />
        <div
          className="absolute left-0 top-3.5 h-0.5 bg-[#1D9E75] transition-all duration-700 ease-in-out"
          style={{ width: `${(currentIdx / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className="relative flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  done
                    ? "bg-[#1D9E75] border-[#1D9E75]"
                    : active
                    ? "bg-[#2C2C2A] border-[#1D9E75] shadow-[0_0_10px_rgba(29,158,117,0.6)]"
                    : "bg-[#2C2C2A] border-[#444441]"
                }`}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : active ? (
                  <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#444441]" />
                )}
              </div>
              <span
                className={`text-[10px] font-mono text-center leading-tight max-w-[52px] ${
                  active ? "text-[#1D9E75] font-semibold" : done ? "text-[#888884]" : "text-[#555552]"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Order items */}
      <div className="bg-[#1e1e1c] rounded-xl p-3 space-y-1">
        {delivery.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-[#aaa]">
              {item.quantity}× {item.name}
            </span>
            <span className="text-[#888884] font-mono tabular-nums">
              ₹{(item.price * item.quantity).toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      {/* Customer info */}
      <div className="flex items-center justify-between bg-[#1e1e1c] rounded-xl px-4 py-3">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-[#1D9E75] mt-0.5 shrink-0" />
          <div>
            <p className="text-white text-sm font-medium">{delivery.customerName}</p>
            <p className="text-[#888884] text-xs">{delivery.customerAddress}</p>
          </div>
        </div>
        <a
          href={`tel:${delivery.customerPhone}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D9E75] text-white text-xs font-semibold hover:opacity-90 transition"
        >
          <Phone size={12} /> Call
        </a>
      </div>

      {actionLabel && (
        <button
          disabled={updating}
          onClick={async () => {
            setUpdating(true);
            try { await onStepUpdate(); } finally { setUpdating(false); }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1D9E75] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition"
        >
          {updating ? <Loader2 size={16} className="animate-spin" /> : actionLabel}
        </button>
      )}
    </div>
  );
};

export default DeliveryStepperCard;
