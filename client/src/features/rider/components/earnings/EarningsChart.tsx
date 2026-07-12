import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import type { IRiderEarnings } from "@/types";
import SectionCard from "@/components/ui/SectionCard";

interface EarningsChartProps {
  earnings: IRiderEarnings;
  type?: "bar" | "area";
}

const EarningsChart = memo(({ earnings, type = "bar" }: EarningsChartProps) => {
  const data = earnings.weeklyBreakdown.map(({ date, amount }) => {
    const [y, m, d] = date.split("-");
    const label = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-IN", { weekday: "short" });
    return { day: label, amount };
  });

  return (
    <SectionCard title="Last 7 Days">
      <ResponsiveContainer width="100%" height={160}>
        {type === "area" ? (
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C22630" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C22630" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => [`₹${v}`, "Earnings"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="amount" stroke="#C22630" strokeWidth={2} fill="url(#earningsGrad)" />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => [`₹${v}`, "Earnings"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="amount" fill="#C22630" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </SectionCard>
  );
});

EarningsChart.displayName = "EarningsChart";
export default EarningsChart;
