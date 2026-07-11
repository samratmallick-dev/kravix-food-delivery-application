import { memo, useState } from "react";
import { Loader2, MapPin, Phone, KeyRound, Wallet, Clock } from "lucide-react";
import type { IOrder } from "../../../types/types";
import DeliveryTimeline from "./DeliveryTimeline";
import { useDeliveryTimer } from "../../../hooks/useDeliveryTimer";

const RIDER_STATUS_LABEL: Record<string, string> = {
  ready_for_rider:           "Order is ready — Go to restaurant",
  rider_assigned:            "New order assigned — Head to restaurant",
  picked_up:                 "Picked up — Start delivery",
  out_for_delivery:          "On the way to customer",
  reached_delivery_location: "Reached customer location — Enter OTP",
  delivered:                 "Delivered successfully",
};

const RIDER_NEXT_ACTION: Record<string, string | null> = {
  ready_for_rider:           "Pick up order",
  rider_assigned:            "Pick up order",
  picked_up:                 "Start delivery",
  out_for_delivery:          "Mark as arrived",
  reached_delivery_location: "Confirm Delivery",
  delivered:                 null,
};

const COD_OPTIONS = [
  { value: "cash",   label: "Cash",   emoji: "💵" },
  { value: "upi",    label: "UPI",    emoji: "📱" },
  { value: "card",   label: "Card",   emoji: "💳" },
  { value: "wallet", label: "Wallet", emoji: "👛" },
];

interface CurrentOrderCardProps {
  order: IOrder;
  onStatusUpdate: (otp?: string, codPaymentMode?: string) => Promise<void>;
  onGenerateOtp: () => Promise<void>;
}

const CurrentOrderCard = memo(({ order, onStatusUpdate, onGenerateOtp }: CurrentOrderCardProps) => {
  const [updating, setUpdating] = useState(false);
  const [generatingOtp, setGeneratingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [selectedCodMode, setSelectedCodMode] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const { formatted } = useDeliveryTimer(order.createdAt);

  const label = RIDER_STATUS_LABEL[order.status] ?? order.status.replace(/_/g, " ");
  const actionLabel = RIDER_NEXT_ACTION[order.status] ?? null;
  const needsOtp = order.status === "reached_delivery_location";
  const isCod = order.paymentMethod === "cod";
  const needsCodPayment = needsOtp && isCod;

  const isConfirmDisabled =
    updating ||
    (needsOtp && otpSent && otp.length !== 6) ||
    (needsOtp && !otpSent) ||
    (needsCodPayment && !selectedCodMode);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-md)] overflow-hidden rider-page-enter">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-gray-800">{order.restaurantName}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">#{order._id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ring-1 text-center ${order.status === "rider_assigned" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-indigo-50 text-indigo-700 ring-indigo-200"}`}>
            {label}
          </span>
          {isCod && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">COD</span>}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Timer */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={12} className="text-primary" />
          <span>Delivery timer: <span className="font-mono font-bold text-gray-700">{formatted}</span></span>
        </div>

        {/* Items */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-gray-700">
              <span>{item.quantity}× {item.name}</span>
              <span className="tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-gray-500">
          <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
          <span>{order.deliveryAddress?.formatedAddress || "Address not available"}</span>
        </div>

        {/* Customer */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Phone size={14} className="text-primary shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Customer</p>
              <p className="font-medium">{order.deliveryAddress?.customerName || "Customer"}</p>
              <p className="text-xs text-gray-500">{order.deliveryAddress?.mobile || "N/A"}</p>
            </div>
          </div>
          <a href={`tel:${order.deliveryAddress?.mobile || ""}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-red-700 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={`Call ${order.deliveryAddress?.customerName}`}
          >
            Call
          </a>
        </div>

        {/* Earnings */}
        <div className="flex justify-between text-sm font-bold text-gray-800 pt-1 border-t border-dashed border-gray-200">
          <span>Rider Earnings</span>
          <span className="text-green-600">₹{order.riderAmount}</span>
        </div>

        {/* COD amount */}
        {isCod && (
          <div className="flex justify-between text-sm text-gray-700 bg-orange-50 rounded-xl px-3 py-2.5 border border-orange-100">
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-orange-500 shrink-0" />
              <span>COD Amount to Collect</span>
            </div>
            <span className="font-bold text-orange-700">₹{order.totalAmount}</span>
          </div>
        )}

        {/* Timeline toggle */}
        <button
          onClick={() => setShowTimeline((v) => !v)}
          className="w-full text-xs font-semibold text-primary hover:text-red-700 transition py-1"
        >
          {showTimeline ? "Hide" : "Show"} delivery timeline
        </button>

        {showTimeline && (
          <div className="bg-gray-50 rounded-xl p-4">
            <DeliveryTimeline order={order} />
          </div>
        )}

        {/* OTP section */}
        {needsOtp && (
          <div className="space-y-3 bg-primary/10 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-primary shrink-0" />
              <p className="text-sm font-semibold text-primary">Delivery OTP Verification</p>
            </div>
            {!otpSent ? (
              <button
                disabled={generatingOtp}
                onClick={async () => {
                  setGeneratingOtp(true);
                  try { await onGenerateOtp(); setOtpSent(true); } finally { setGeneratingOtp(false); }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-red-700 disabled:opacity-60 transition"
              >
                {generatingOtp ? <Loader2 size={15} className="animate-spin" /> : "Send OTP to Customer"}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-primary">OTP sent. Ask the customer for the code.</p>
                <input
                  type="text" inputMode="numeric" maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full border border-primary/30 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono outline-none focus:border-primary"
                  aria-label="Enter delivery OTP"
                />
              </div>
            )}
          </div>
        )}

        {/* COD payment mode */}
        {needsCodPayment && (
          <div className="space-y-2 bg-orange-50 rounded-xl p-4 border border-orange-200">
            <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
              <Wallet size={15} className="shrink-0" /> How did the customer pay?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedCodMode(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition min-h-[44px] ${selectedCodMode === opt.value ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"}`}
                >
                  <span>{opt.emoji}</span>{opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        {actionLabel && (
          <button
            disabled={isConfirmDisabled}
            onClick={async () => {
              setUpdating(true);
              try {
                await onStatusUpdate(
                  needsOtp && otpSent ? otp : undefined,
                  needsCodPayment && selectedCodMode ? selectedCodMode : undefined,
                );
                setOtp(""); setOtpSent(false); setSelectedCodMode(null);
              } finally { setUpdating(false); }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl bg-primary text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition active:scale-95"
          >
            {updating ? <Loader2 size={16} className="animate-spin" /> : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
});

CurrentOrderCard.displayName = "CurrentOrderCard";
export default CurrentOrderCard;
