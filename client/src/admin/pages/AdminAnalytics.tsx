import { useState } from "react";
import { BarChart2 } from "lucide-react";
import { useAdminAnalytics } from "../hooks/useAdminQueries";
import HeatmapGrid from "../components/charts/HeatmapGrid";
import OrdersBarChart from "../components/charts/OrdersBarChart";
import RetentionChart from "../components/charts/RetentionChart";
import RevenueLineChart from "../components/charts/RevenueLineChart";

type Range = "7d" | "30d" | "90d";

const RANGES: { label: string; value: Range }[] = [
  { label: "7 days",  value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
];

const ChartCard = ({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4"
    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
    <h3 className="text-sm font-bold text-gray-700 mb-3">{title}</h3>
    {loading ? <div className="h-48 bg-gray-50 rounded-lg animate-pulse" /> : children}
  </div>
);

const AdminAnalytics = () => {
  const [range, setRange] = useState<Range>("30d");
  const { data, isLoading } = useAdminAnalytics(range);

  const topRestaurantsData = (data?.topRestaurants ?? []).map((r) => ({
    name: r.name.length > 18 ? r.name.slice(0, 18) + "…" : r.name,
    value: r.revenue,
  }));

  const topRidersData = (data?.topRiders ?? []).map((r) => ({
    name: r.name.length > 18 ? r.name.slice(0, 18) + "…" : r.name,
    value: r.deliveries,
  }));

  const avgDeliveryData = (data?.avgDeliveryTrend ?? []).map((d) => ({
    date: d.date,
    revenue: d.avgMinutes,
  }));

  return (
    <div className="p-5 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Platform performance insights</p>
        </div>
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${range === r.value ? "bg-[#185FA5] text-white" : "text-gray-500 hover:text-gray-700"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <ChartCard title="Orders Heatmap — Hour × Day of Week" loading={isLoading}>
        {data?.heatmap ? (
          <HeatmapGrid data={data.heatmap} />
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
            <BarChart2 size={24} className="mr-2" /> No heatmap data
          </div>
        )}
      </ChartCard>

      {/* Top restaurants + top riders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top 10 Restaurants by Revenue" loading={isLoading}>
          <OrdersBarChart
            data={topRestaurantsData}
            color="#185FA5"
            valueLabel="Revenue"
            valueFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
        </ChartCard>
        <ChartCard title="Top 10 Riders by Deliveries" loading={isLoading}>
          <OrdersBarChart
            data={topRidersData}
            color="#1D9E75"
            valueLabel="Deliveries"
            valueFormatter={(v) => String(v)}
          />
        </ChartCard>
      </div>

      {/* Retention + avg delivery time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Customer Retention — New vs Returning" loading={isLoading}>
          <RetentionChart data={data?.retention ?? []} />
        </ChartCard>
        <ChartCard title="Avg Delivery Time Trend (minutes)" loading={isLoading}>
          <RevenueLineChart data={avgDeliveryData} />
        </ChartCard>
      </div>

      {!isLoading && !data && (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <BarChart2 size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Analytics data unavailable.</p>
          <p className="text-xs text-gray-300 mt-1">The /analytics endpoint needs to be implemented on the backend.</p>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
