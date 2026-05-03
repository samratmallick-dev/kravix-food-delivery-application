import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { EarningBreakdown } from "../../types/rider.types";

interface Props {
  breakdown: EarningBreakdown[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e1e1c] border border-[#3a3a37] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[#888884] text-xs font-mono mb-1">{label}</p>
      <p className="text-[#1D9E75] font-mono font-bold text-sm">₹{payload[0].value}</p>
    </div>
  );
};

const EarningsBarChart = ({ breakdown }: Props) => {
  const avg =
    breakdown.length > 0
      ? breakdown.reduce((s, d) => s + d.amount, 0) / breakdown.length
      : 0;

  const data = breakdown.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
    amount: d.amount,
  }));

  if (!data.length) {
    return (
      <div className="bg-[#2C2C2A] border border-[#3a3a37] rounded-2xl p-8 flex flex-col items-center gap-2">
        <span className="text-4xl">📊</span>
        <p className="text-[#888884] text-sm">No earnings data for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2C2C2A] border border-[#3a3a37] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white font-semibold text-sm">Last 7 Days Earnings</p>
        <span className="text-[#888884] text-xs font-mono">
          avg ₹{avg.toFixed(0)}/day
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: "#888884", fontSize: 10, fontFamily: "DM Mono, monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#888884", fontSize: 10, fontFamily: "DM Mono, monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <ReferenceLine
            y={avg}
            stroke="#EF9F27"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: "avg", fill: "#EF9F27", fontSize: 9, fontFamily: "DM Mono" }}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.amount >= avg ? "#1D9E75" : "#444441"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EarningsBarChart;
