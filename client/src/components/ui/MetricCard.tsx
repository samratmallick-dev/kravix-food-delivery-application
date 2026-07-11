import { memo, type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendDir?: "up" | "down" | "neutral";
  color?: "green" | "blue" | "purple" | "orange" | "red";
  className?: string;
}

const colorMap = {
  green:  { bg: "bg-green-50",  text: "text-green-700",  icon: "text-green-500" },
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   icon: "text-blue-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", icon: "text-purple-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", icon: "text-orange-500" },
  red:    { bg: "bg-red-50",    text: "text-red-700",    icon: "text-red-500" },
};

const MetricCard = memo(({ icon, label, value, trend, trendDir = "neutral", color = "blue", className = "" }: MetricCardProps) => {
  const c = colorMap[color];
  const TrendIcon = trendDir === "up" ? TrendingUp : trendDir === "down" ? TrendingDown : Minus;
  const trendColor = trendDir === "up" ? "text-green-600" : trendDir === "down" ? "text-red-500" : "text-gray-400";

  return (
    <div className={`${c.bg} rounded-2xl p-4 space-y-2 ${className}`}>
      <div className={`${c.icon} w-8 h-8 flex items-center justify-center`}>{icon}</div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-xl font-bold ${c.text} count-up`}>{value}</p>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          <TrendIcon size={12} />{trend}
        </div>
      )}
    </div>
  );
});

MetricCard.displayName = "MetricCard";
export default MetricCard;
