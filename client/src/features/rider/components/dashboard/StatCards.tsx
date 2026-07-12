import { memo, useMemo } from "react";
import { IndianRupee, Package, Star, CheckCircle2 } from "lucide-react";
import MetricCard from "@/components/ui/MetricCard";
import type { IRiderEarnings } from "@/types";
import type { IOrder } from "@/types";

interface StatCardsProps {
  earnings: IRiderEarnings | null;
  history: IOrder[];
}

const StatCards = memo(({ earnings, history }: StatCardsProps) => {
  const completionRate = useMemo(() => {
    if (!history.length) return "N/A";
    const delivered = history.filter((o) => o.status === "delivered").length;
    return `${Math.round((delivered / history.length) * 100)}%`;
  }, [history]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        icon={<IndianRupee size={18} />}
        label="Today's Earnings"
        value={`₹${earnings?.todayEarnings ?? 0}`}
        color="green"
      />
      <MetricCard
        icon={<Package size={18} />}
        label="Total Deliveries"
        value={earnings?.totalDeliveries ?? 0}
        color="blue"
      />
      <MetricCard
        icon={<Star size={18} />}
        label="Rating"
        value={earnings?.rating !== null && earnings?.rating !== undefined ? `${earnings.rating.toFixed(1)}/5` : "N/A"}
        color="orange"
      />
      <MetricCard
        icon={<CheckCircle2 size={18} />}
        label="Completion Rate"
        value={completionRate}
        color="purple"
      />
    </div>
  );
});

StatCards.displayName = "StatCards";
export default StatCards;
