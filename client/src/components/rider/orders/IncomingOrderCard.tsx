import { memo, useEffect, useRef, useState } from "react";
import { Bike, Loader2, IndianRupee } from "lucide-react";

const TIMEOUT = 10;

interface IncomingOrderCardProps {
  orderId: string;
  onAccept?: () => Promise<void>;
  onExpire: () => void;
}

const IncomingOrderCard = memo(({ orderId, onAccept, onExpire }: IncomingOrderCardProps) => {
  const [accepting, setAccepting] = useState(false);
  const [countdown, setCountdown] = useState(TIMEOUT);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); onExpireRef.current(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progress = (countdown / TIMEOUT) * 100;

  return (
    <div className="slide-up-enter bg-white rounded-2xl border-2 border-primary shadow-[var(--shadow-lg)] overflow-hidden" role="alert" aria-live="polite">
      <div className="h-1.5 w-full bg-gray-100">
        <div className="h-1.5 bg-primary transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
      </div>
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center pulse-ring">
            <Bike size={20} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">New Order Available!</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-400 font-mono">#{orderId.slice(-8).toUpperCase()}</p>
              <span className="flex items-center text-xs text-green-600 font-semibold">
                <IndianRupee size={10} />Earn now
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold tabular-nums w-6 text-center ${countdown <= 3 ? "text-red-500" : "text-gray-400"}`}>
            {countdown}s
          </span>
          <button
            disabled={accepting || !onAccept}
            onClick={async () => {
              if (!onAccept) return;
              setAccepting(true);
              try { await onAccept(); } finally { setAccepting(false); }
            }}
            className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition active:scale-95 min-w-[44px] min-h-[44px] justify-center"
          >
            {accepting ? <Loader2 size={15} className="animate-spin" /> : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
});

IncomingOrderCard.displayName = "IncomingOrderCard";
export default IncomingOrderCard;
