import { useEffect, useRef, useState } from "react";
import { Bike, X, Loader2 } from "lucide-react";
import type { IncomingOrder } from "../../types/rider.types";

interface Props {
  order: IncomingOrder;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}

const TIMEOUT = 30;

const OrderIncomingBanner = ({ order, onAccept, onDecline }: Props) => {
  const [countdown, setCountdown] = useState(TIMEOUT);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [visible, setVisible] = useState(false);
  const onDeclineRef = useRef(onDecline);
  onDeclineRef.current = onDecline;

  useEffect(() => {
    // Slide in
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDeclineRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progress = (countdown / TIMEOUT) * 100;
  const urgent = countdown <= 8;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label="New incoming order"
      className={`transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border-2 ${
          urgent ? "border-[#E24B4A]" : "border-[#1D9E75]"
        } bg-[#1a2e26] shadow-[0_8px_32px_rgba(29,158,117,0.25)]`}
      >
        {/* Progress bar */}
        <div className="h-1 w-full bg-[#2C2C2A]">
          <div
            className={`h-1 transition-all duration-1000 ease-linear ${
              urgent ? "bg-[#E24B4A]" : "bg-[#1D9E75]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#1D9E75]/20 flex items-center justify-center shrink-0">
              <Bike size={20} className="text-[#1D9E75]" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">New Order!</p>
              <p className="text-[#1D9E75] font-mono text-xs truncate">{order.restaurantName}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[#888884] text-xs">{order.distanceKm.toFixed(1)} km</span>
                <span className="text-[#EF9F27] text-xs font-semibold font-mono">
                  ₹{order.payout}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`font-mono text-sm font-bold w-8 text-center tabular-nums ${
                urgent ? "text-[#E24B4A]" : "text-[#888884]"
              }`}
            >
              {countdown}s
            </span>
            <button
              onClick={async () => {
                setDeclining(true);
                try { await onDecline(); } finally { setDeclining(false); }
              }}
              disabled={accepting || declining}
              aria-label="Decline order"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2C2A] border border-[#444441] text-[#E24B4A] text-sm font-semibold hover:bg-[#3a1a1a] transition disabled:opacity-50"
            >
              {declining ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
              Decline
            </button>
            <button
              onClick={async () => {
                setAccepting(true);
                try { await onAccept(); } finally { setAccepting(false); }
              }}
              disabled={accepting || declining}
              aria-label="Accept order"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {accepting ? <Loader2 size={14} className="animate-spin" /> : <Bike size={14} />}
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderIncomingBanner;
