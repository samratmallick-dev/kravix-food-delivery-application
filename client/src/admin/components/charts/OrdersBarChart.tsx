import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface OrdersBarChartProps {
  data: { name: string; value: number }[];
  color?: string;
  valueLabel?: string;
  valueFormatter?: (v: number) => string;
}

const OrdersBarChart = ({
  data,
  color = "#185FA5",
  valueLabel = "Value",
  valueFormatter = (v) => String(v),
}: OrdersBarChartProps) => {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data</div>
  );

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#374151" }}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip
          formatter={(v: number) => [valueFormatter(v), valueLabel]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} fillOpacity={1 - i * 0.06} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default OrdersBarChart;
