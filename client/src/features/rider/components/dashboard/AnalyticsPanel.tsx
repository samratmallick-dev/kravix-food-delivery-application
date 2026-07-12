import { memo, useMemo } from "react";
import { Clock, Percent, XCircle, Fuel, Route } from "lucide-react";
import SectionCard from "@/components/ui/SectionCard";
import type { IOrder } from "@/types";
import type { IRiderEarnings } from "@/types";

const FUEL_RATE = 2;

interface AnalyticsPanelProps {
  history: IOrder[];
  earnings: IRiderEarnings | null;
}

const AnalyticsPanel = memo(({ history, earnings }: AnalyticsPanelProps) => {
  const stats = useMemo(() => {
    const delivered = history.filter((o) => o.status === "delivered");
    const cancelled = history.filter((o) => o.status === "cancelled");
    const totalKm = delivered.reduce((sum, o) => sum + (o.distance || 0), 0);
    const avgTime = delivered.length
      ? Math.round(delivered.reduce((sum, o) => {
          const diff = new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime();
          return sum + diff / 60000;
        }, 0) / delivered.length)
      : 0;
    const acceptanceRate = history.length
      ? Math.round((delivered.length / history.length) * 100)
      : 0;
    const cancellationRate = history.length
      ? Math.round((cancelled.length / history.length) * 100)
      : 0;

    return { totalKm, avgTime, acceptanceRate, cancellationRate, fuelEst: Math.round(totalKm * FUEL_RATE) };
  }, [history]);

  const rows = [
    { icon: <Percent size={14} className="text-blue-500" />,   label: "Acceptance Rate",    value: `${stats.acceptanceRate}%` },
    { icon: <Clock size={14} className="text-purple-500" />,   label: "Avg Delivery Time",  value: stats.avgTime ? `${stats.avgTime} min` : "N/A" },
    { icon: <XCircle size={14} className="text-red-400" />,    label: "Cancellation Rate",  value: `${stats.cancellationRate}%` },
    { icon: <Route size={14} className="text-green-500" />,    label: "Distance Travelled", value: `${stats.totalKm.toFixed(1)} km` },
    { icon: <Fuel size={14} className="text-orange-500" />,    label: "Fuel Estimate",      value: `₹${stats.fuelEst}` },
  ];

  return (
    <SectionCard title="Performance Analytics">
      <div className="space-y-3">
        {rows.map(({ icon, label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {icon}{label}
            </div>
            <span className="text-sm font-bold text-gray-800">{value}</span>
          </div>
        ))}
        {earnings && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Week Earnings</span>
            <span className="text-sm font-bold text-green-700">₹{earnings.weekEarnings}</span>
          </div>
        )}
      </div>
    </SectionCard>
  );
});

AnalyticsPanel.displayName = "AnalyticsPanel";
export default AnalyticsPanel;
