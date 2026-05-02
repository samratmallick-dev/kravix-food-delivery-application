import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface RetentionChartProps {
  data: { month: string; newCustomers: number; returning: number }[];
}

const RetentionChart = ({ data }: RetentionChartProps) => {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data</div>
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ fontSize: 11, color: "#6b7280" }}>{v}</span>}
        />
        <Bar dataKey="newCustomers" name="New" stackId="a" fill="#185FA5" radius={[0, 0, 0, 0]} maxBarSize={32} />
        <Bar dataKey="returning" name="Returning" stackId="a" fill="#1D9E75" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RetentionChart;
