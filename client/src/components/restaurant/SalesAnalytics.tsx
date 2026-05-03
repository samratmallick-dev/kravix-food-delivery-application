import { useEffect, useState } from "react";
import axios from "axios";
import { orderBaseUrl } from "../common/constant";
import { TrendingUp, ShoppingBag, IndianRupee } from "lucide-react";
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

      const { summary, salesTrend, topItems, orderDistribution } = stats;

      const summaryCards = [
            { label: "Total Revenue", value: formatCurrency(summary.totalRevenue), icon: <IndianRupee className="w-5 h-5 text-primary" /> },
            { label: "Total Orders", value: summary.totalOrders.toString(), icon: <ShoppingBag className="w-5 h-5 text-primary" /> },
            { label: "Avg. Order Value", value: formatCurrency(summary.avgOrderValue), icon: <TrendingUp className="w-5 h-5 text-primary" /> },
      ];

      const deliveredCount = orderDistribution.find((d) => d.status === "delivered")?.count ?? 0;
      const cancelledCount = orderDistribution.find((d) => d.status === "cancelled")?.count ?? 0;
      const totalTracked = deliveredCount + cancelledCount;
      const successRate = totalTracked > 0 ? ((deliveredCount / totalTracked) * 100).toFixed(1) : "N/A";

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
                        <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-semibold text-gray-700">Revenue Trend — Last 30 Days</h3>
                              <span className="text-xs text-gray-400">{salesTrend.length} days with orders</span>
                        </div>
                        {salesTrend.length === 0 ? (
                              <p className="text-center text-sm text-gray-400 py-10">No delivered orders in the last 30 days</p>
                        ) : (
                              <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={salesTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                          <defs>
                                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                                                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                                </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                          <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                          <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={55} />
                                          <Tooltip
                                                formatter={(v) => [formatCurrency(Number(v)), "Revenue"]}
                                                labelFormatter={(l) => formatDate(l)}
                                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                          />
                                          <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5 }} />
                                    </AreaChart>
                              </ResponsiveContainer>
                        )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Top 5 Items */}
                        <div className="bg-white rounded-2xl shadow-md p-5">
                              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 5 Items by Quantity Sold</h3>
                              {topItems.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-8">No data yet</p>
                              ) : (
                                    <ResponsiveContainer width="100%" height={200}>
                                          <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                                                <Tooltip
                                                      formatter={(v) => [Number(v), "Qty Sold"]}
                                                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                                />
                                                <Bar dataKey="totalQuantity" radius={[0, 6, 6, 0]}>
                                                      {topItems.map((_, i) => (
                                                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                                      ))}
                                                </Bar>
                                          </BarChart>
                                    </ResponsiveContainer>
                              )}
                        </div>

                        {/* Order Distribution */}
                        <div className="bg-white rounded-2xl shadow-md p-5">
                              <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Distribution</h3>
                              <div className="space-y-3">
                                    {orderDistribution.map((item) => {
                                          const total = orderDistribution.reduce((s, d) => s + d.count, 0);
                                          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";
                                          const label = item.status.replace(/_/g, " ");
                                          return (
                                                <div key={item.status}>
                                                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                            <span className="capitalize">{label}</span>
                                                            <span className="font-medium">{item.count} ({pct}%)</span>
                                                      </div>
                                                      <div className="w-full bg-gray-100 rounded-full h-2">
                                                            <div
                                                                  className="h-2 rounded-full"
                                                                  style={{
                                                                        width: `${pct}%`,
                                                                        backgroundColor: item.status === "delivered" ? "#22c55e" : item.status === "cancelled" ? "#ef4444" : "#f97316"
                                                                  }}
                                                            />
                                                      </div>
                                                </div>
                                          );
                                    })}
                              </div>
                              {totalTracked > 0 && (
                                    <p className="text-xs text-gray-400 mt-4">
                                          Success rate: <span className="font-semibold text-green-600">{successRate}%</span>
                                    </p>
                              )}
                        </div>
                  </div>
            </div>
      );
}
