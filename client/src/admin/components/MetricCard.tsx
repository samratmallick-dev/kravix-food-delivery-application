import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub?: string;
  trend?: number; // positive = up, negative = down
  accentColor?: string;
  loading?: boolean;
}

const MetricCard = ({ icon: Icon, label, value, sub, trend, accentColor = "#185FA5", loading }: MetricCardProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 animate-pulse"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-7 w-20 bg-gray-100 rounded" />
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${accentColor}14` }}>
            <Icon size={15} style={{ color: accentColor }} />
          </div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend >= 0 ? "text-[#1D9E75]" : "text-[#E24B4A]"}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 font-mono leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 leading-tight">{sub}</p>}
    </div>
  );
};

export default MetricCard;
