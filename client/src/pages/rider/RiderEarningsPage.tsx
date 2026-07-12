import { useEffect, useState } from "react";
import { useEarnings } from "@/features/rider/hooks/useEarnings";
import { useDeliveryHistory } from "@/features/rider/hooks/useDeliveryHistory";
import EarningsOverview from "@/features/rider/components/earnings/EarningsOverview";
import EarningsChart from "@/features/rider/components/earnings/EarningsChart";
import AnalyticsPanel from "@/features/rider/components/dashboard/AnalyticsPanel";
import { EarningsSkeleton } from "@/features/rider/components/skeletons/RiderSkeletons";

type Period = "today" | "week" | "month" | "all";

const Earnings = () => {
  const { earnings, loading, fetchData } = useEarnings();
  const { history, fetchHistory } = useDeliveryHistory();
  const [period, setPeriod] = useState<Period>("week");
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  useEffect(() => { fetchData(); fetchHistory(); }, [fetchData, fetchHistory]);

  if (loading) return <EarningsSkeleton />;
  if (!earnings) return <p className="text-center text-gray-500 py-12">Failed to load earnings</p>;

  return (
    <div className="space-y-4 rider-page-enter">
      <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-gray-100 shadow-(--shadow-sm)">
        {(["today", "week", "month", "all"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${period === p ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            {p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
          </button>
        ))}
      </div>

      <EarningsOverview earnings={earnings} />

      <div className="flex gap-2 justify-end">
        {(["bar", "area"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setChartType(t)}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition ${chartType === t ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}
          >
            {t === "bar" ? "Bar" : "Area"}
          </button>
        ))}
      </div>

      <EarningsChart earnings={earnings} type={chartType} />
      <AnalyticsPanel history={history} earnings={earnings} />
    </div>
  );
};

export default Earnings;
