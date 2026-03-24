import { useEffect, useRef, useState } from "react";
import { Bike, Loader2 } from "lucide-react";

const TIMEOUT = 10;

const IncomingOrderCard = ({
      orderId,
      onAccept,
      onExpire,
}: {
      orderId: string;
      onAccept: () => Promise<void>;
      onExpire: () => void;
}) => {
      const [accepting, setAccepting] = useState(false);
      const [countdown, setCountdown] = useState(TIMEOUT);
      const onExpireRef = useRef(onExpire);
      onExpireRef.current = onExpire;

      useEffect(() => {
            const interval = setInterval(() => {
                  setCountdown((prev) => {
                        if (prev <= 1) {
                              clearInterval(interval);
                              onExpireRef.current();
                              return 0;
                        }
                        return prev - 1;
                  });
            }, 1000);
            return () => clearInterval(interval);
      }, []);

      const progress = (countdown / TIMEOUT) * 100;

      return (
            <div className="bg-white rounded-2xl border-2 border-primary shadow-md overflow-hidden">
                  {/* countdown progress bar */}
                  <div className="h-1 w-full bg-gray-100">
                        <div
                              className="h-1 bg-primary transition-all duration-1000 ease-linear"
                              style={{ width: `${progress}%` }}
                        />
                  </div>
                  <div className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                              <Bike size={24} className="text-primary shrink-0" />
                              <div>
                                    <p className="font-bold text-gray-800 text-sm">New Order Available!</p>
                                    <p className="text-xs text-gray-400 font-mono">#{orderId.slice(-8).toUpperCase()}</p>
                              </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs font-bold tabular-nums w-6 text-center ${countdown <= 3 ? "text-red-500" : "text-gray-400"}`}>
                                    {countdown}s
                              </span>
                              <button
                                    disabled={accepting}
                                    onClick={async () => {
                                          setAccepting(true);
                                          try {
                                                await onAccept();
                                          } finally {
                                                setAccepting(false);
                                          }
                                    }}
                                    className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                              >
                                    {accepting ? <Loader2 size={16} className="animate-spin" /> : "Accept"}
                              </button>
                        </div>
                  </div>
            </div>
      );
};

export default IncomingOrderCard;
