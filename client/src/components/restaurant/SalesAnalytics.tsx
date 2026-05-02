import { useEffect, useState } from "react";
import axios from "axios";
import { orderBaseUrl } from "../common/constant";
import { TrendingUp, ShoppingBag, BadgeIndianRupee } from "lucide-react";
import {
      ResponsiveContainer,
      AreaChart,
      Area,
      XAxis,
      YAxis,
      CartesianGrid,
      Tooltip,
      BarChart,
      Bar,
      Cell,
} from "recharts";

interface SalesStats {
      summary: { totalRevenue: number; totalOrders: number; avgOrderValue: number };
      salesTrend: { date: string; revenue: number; orders: number }[];
      topItems: { name: string; totalQuantity: number; totalRevenue: number }[];
      orderDistribution: { status: string; count: number }[];
}

const PRIMARY = "#f97316";
const BAR_COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

const formatCurrency = (v: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) => {
      const date = new Date(d);
      return `${date.getDate()} ${date.toLocaleString("en-IN", { month: "short" })}`;
};

export default function SalesAnalytics({ restaurantId }: { restaurantId: string }) {
      const [stats, setStats] = useState<SalesStats | null>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(false);

      useEffect(() => {
            const fetch = async () => {
                  try {
                        const { data } = await axios.get(
                              `${orderBaseUrl}/restaurants/${restaurantId}/sales-stats`,
                              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, withCredentials: true }
                        );
                        setStats(data.data);
                  } catch {
                        setError(true);
                  } finally {
                        setLoading(false);
                  }
            };
            fetch();
      }, [restaurantId]);

      if (loading) {
            return (
                  <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
            );
      }

      if (error || !stats) {
            return (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                        <span className="text-4xl">⚠️</span>
                        <p className="text-sm font-medium">Failed to load analytics</p>
                  </div>
            );
      }

      const summaryCards = [
            { label: "Total Revenue", value: formatCurrency(stats.summary.totalRevenue), icon: <BadgeIndianRupee className="w-5 h-5 text-primary" /> },
            { label: "Total Orders", value: stats.summary.totalOrders.toString(), icon: <ShoppingBag className="w-5 h-5 text-primary" /> },
            { label: "Avg. Order Value", value: formatCurrency(stats.summary.avgOrderValue), icon: <TrendingUp className="w-5 h-5 text-primary" /> },
      ];

      return (
            <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {summaryCards.map((card) => (
                              <div key={card.label} className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl">{card.icon}</div>
                                    <div>
                                          <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                                          <p className="text-xl font-bold text-gray-800">{card.value}</p>
                                    </div>
                              </div>
                        ))}
                  </div>

                  {/* Revenue Trend */}
                  <div className="bg-white rounded-2xl shadow-md p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend — Last 30 Days</h3>
                        {stats.salesTrend.length === 0 ? (
                              <p className="text-center text-sm text-gray-400 py-10">No data for the last 30 days</p>
                        ) : (
                              <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={stats.salesTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                          <defs>
                                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                      <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.25} />
                                                      <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                                                </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                          <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={55} />
                                          <Tooltip
                                                formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                                                labelFormatter={(l) => formatDate(l)}
                                                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                          />
                                          <Area type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5 }} />
                                    </AreaChart>
                              </ResponsiveContainer>
                        )}
                  </div>

                  {/* Top Items */}
                  <div className="bg-white rounded-2xl shadow-md p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 5 Selling Items</h3>
                        {stats.topItems.length === 0 ? (
                              <p className="text-center text-sm text-gray-400 py-10">No items data available</p>
                        ) : (
                              <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={stats.topItems} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                                          <Tooltip
                                                formatter={(v: number) => [v, "Qty Sold"]}
                                                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                          />
                                          <Bar dataKey="totalQuantity" radius={[0, 6, 6, 0]}>
                                                {stats.topItems.map((_, i) => (
                                                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                                ))}
                                          </Bar>
                                    </BarChart>
                              </ResponsiveContainer>
                        )}
                  </div>
            </div>
      );
}
