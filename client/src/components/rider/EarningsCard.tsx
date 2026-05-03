import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  label: string;
  value: number;
  prefix?: string;
  trend?: number;
  sub?: string;
}

const EarningsCard = ({ label, value, prefix = "₹", trend, sub }: Props) => {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    const from = 0;
    const to = value;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  const trendUp = trend !== undefined && trend >= 0;

  return (
    <div className="bg-[#2C2C2A] border border-[#3a3a37] rounded-xl p-4 space-y-1">
      <p className="text-[#888884] text-xs font-mono uppercase tracking-widest">{label}</p>
      <p className="text-white text-2xl font-mono font-bold">
        {prefix}{displayed.toLocaleString("en-IN")}
      </p>
      <div className="flex items-center justify-between">
        {sub && <span className="text-[#888884] text-xs">{sub}</span>}
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              trendUp ? "text-[#1D9E75]" : "text-[#E24B4A]"
            }`}
          >
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default EarningsCard;
