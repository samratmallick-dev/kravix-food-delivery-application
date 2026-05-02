import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface RevenueLineChartProps {
  data: { date: string; revenue: number }[];
}

const RevenueLineChart = ({ data }: RevenueLineChartProps) => {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data</div>
  );

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#185FA5" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#185FA5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(v) => [`₹${(v as number).toLocaleString("en-IN")}`, "Revenue"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          labelStyle={{ color: "#374151", fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#185FA5"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#185FA5" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueLineChart;
