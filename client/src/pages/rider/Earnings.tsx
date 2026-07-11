import { useEffect, useState } from "react";
import { useEarnings } from "../../hooks/useEarnings";
import { useDeliveryHistory } from "../../hooks/useDeliveryHistory";
import EarningsOverview from "../../components/rider/earnings/EarningsOverview";
import EarningsChart from "../../components/rider/earnings/EarningsChart";
import AnalyticsPanel from "../../components/rider/dashboard/AnalyticsPanel";
import { EarningsSkeleton } from "../../components/skeleton/RiderSkeletons";

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
      {/* Period tabs */}
      <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-gray-100 shadow-[var(--shadow-sm)]">
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

      {/* Chart type toggle */}
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
