import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS: Record<string, string> = {
  placed: "#185FA5",
  accepted: "#EF9F27",
  preparing: "#EF9F27",
  ready_for_rider: "#f97316",
  rider_assigned: "#f97316",
  picked_up: "#8b5cf6",
  out_for_delivery: "#8b5cf6",
  delivered: "#1D9E75",
  cancelled: "#E24B4A",
};

interface DonutChartProps {
  data: Record<string, number>;
}

const DonutChart = ({ data }: DonutChartProps) => {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value, key: name }));

  if (!entries.length) return (
    <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data</div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={entries}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {entries.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value as number, name as string]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 11, color: "#6b7280" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DonutChart;
