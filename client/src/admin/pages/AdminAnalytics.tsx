import { useEffect, useState, useMemo } from "react";
import { getAdminAnalytics, exportAdminAnalytics } from "../../utils/admin.api";
import {
      ResponsiveContainer,
      AreaChart,
      Area,
      XAxis,
      YAxis,
      CartesianGrid,
      Tooltip,
      Legend,
      BarChart,
      Bar,
      LineChart,
      Line,
} from "recharts";
import {
      TrendingUp,
      ShoppingBag,
      Percent,
      Clock,
      Download,
      Calendar,
      Award,
      Utensils,
      IndianRupee,
      RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import StatCard from "../components/StatCard";


interface SummaryData {
      totalRevenue: number;
      totalOrders: number;
      totalCommission: number;
      averageOrderValue: number;
      totalDeliveryFees: number;
      totalPlatformFees: number;
}

interface TrendData {
      label: string;
      orders: number;
      revenue: number;
      deliveryFees: number;
      platformFees: number;
      commission: number;
}

interface FoodItemData {
      name: string;
      quantitySold: number;
      revenue: number;
}

interface PeakHourData {
      hour: number;
      hourLabel: string;
      ordersCount: number;
}

interface RestaurantData {
      restaurantId: string;
      name: string;
      ordersCount: number;
      revenue: number;
}

interface UserGrowthData {
      date: string;
      newRegistrations: number;
      totalUsers: number;
}

interface RiderPerformanceData {
      riderId: string;
      name: string;
      rating: number | null;
      ratingCount: number;
      totalDeliveries: number;
}

interface DashboardAnalyticsData {
      summary: SummaryData;
      trends: TrendData[];
      topFoods: FoodItemData[];
      peakHours: PeakHourData[];
      topRestaurants: RestaurantData[];
      userGrowth: UserGrowthData[];
      riderPerformance: RiderPerformanceData[];
}

const AdminAnalytics = () => {
      const [data, setData] = useState<DashboardAnalyticsData | null>(null);
      const [loading, setLoading] = useState(true);
      const [exporting, setExporting] = useState(false);

      // Filter states
      const [interval, setIntervalVal] = useState<"daily" | "weekly" | "monthly">("daily");
      const [presetRange, setPresetRange] = useState<"today" | "7days" | "30days" | "all">("all");
      const [startDate, setStartDate] = useState<string>("");
      const [endDate, setEndDate] = useState<string>("");

      // Date ranges based on presets
      const resolvedDateRange = useMemo(() => {
            if (presetRange === "all") return { start: "", end: "" };

            const now = new Date();
            const toLocalDate = (d: Date) => {
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  return `${y}-${m}-${day}`;
            };

            const end = toLocalDate(now);
            let start = end;

            if (presetRange === "7days") {
                  const s = new Date(now);
                  s.setDate(now.getDate() - 7);
                  start = toLocalDate(s);
            } else if (presetRange === "30days") {
                  const s = new Date(now);
                  s.setDate(now.getDate() - 30);
                  start = toLocalDate(s);
            }

            return { start, end };
      }, [presetRange]);

      // Apply range changes
      useEffect(() => {
            if (presetRange !== "all") {
                  setStartDate(resolvedDateRange.start);
                  setEndDate(resolvedDateRange.end);
            } else {
                  setStartDate("");
                  setEndDate("");
            }
      }, [presetRange, resolvedDateRange]);

      const fetchAnalytics = async () => {
            setLoading(true);
            try {
                  const params: any = { interval };
                  if (startDate) params.startDate = startDate;
                  if (endDate) params.endDate = endDate;
                  const res = await getAdminAnalytics(params);

                  if (res && res.success) {
                        setData(res.data);
                  } else {
                        toast.error(res.message || "Failed to load analytics");
                  }
            } catch (error: any) {
                  console.error("Analytics fetch error:", error);
                  toast.error(error.message || "Error loading analytics from service");
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchAnalytics();
      }, [interval, startDate, endDate]);

      const handleExportCSV = async () => {
            setExporting(true);
            try {
                  const params: any = { interval };
                  if (startDate) params.startDate = startDate;
                  if (endDate) params.endDate = endDate;
                  const blob = await exportAdminAnalytics(params);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.setAttribute("href", url);
                  a.setAttribute("download", `revenue_trends_${interval}_${Date.now()}.csv`);
                  a.click();
                  toast.success("CSV Exported successfully!");
            } catch (error: any) {
                  console.error("CSV export error:", error);
                  toast.error("Failed to export CSV report");
            } finally {
                  setExporting(false);
            }
      };

      const customTooltipStyles = {
            contentStyle: {
                  backgroundColor: "rgba(17, 24, 39, 0.95)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px"
            },
            itemStyle: { color: "#fff" },
            labelStyle: { color: "#9ca3af", fontWeight: "bold" as const }
      };

      return (
            <div className="p-4 sm:p-6 space-y-6">
                  {/* Top Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <TrendingUp className="text-primary" size={24} />
                                    Advanced Analytics & Reports
                              </h1>
                              <p className="text-xs sm:text-sm text-gray-500">
                                    Monitor system revenue, restaurant sales, rider ratings, and peak platform usage.
                              </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                              <button
                                    onClick={fetchAnalytics}
                                    className="p-2.5 rounded-xl border border-border bg-white text-gray-600 hover:text-gray-900 shadow-xs transition cursor-pointer"
                                    title="Refresh Data"
                              >
                                    <RefreshCw size={18} className={loading ? "animate-spin text-primary" : ""} />
                              </button>
                              <button
                                    onClick={handleExportCSV}
                                    disabled={exporting}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-950 text-white rounded-xl text-sm font-semibold shadow-xs hover:bg-gray-850 transition cursor-pointer disabled:opacity-50"
                              >
                                    <Download size={16} />
                                    {exporting ? "Exporting..." : "Export CSV"}
                              </button>
                        </div>
                  </div>

                  {/* Filter Section */}
                  <div className="bg-white rounded-2xl shadow-xs border border-border p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
                        {/* Ranges Presets */}
                        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                              {(["today", "7days", "30days", "all"] as const).map((r) => (
                                    <button
                                          key={r}
                                          onClick={() => setPresetRange(r)}
                                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                                                presetRange === r
                                                      ? "bg-white text-primary shadow-xs"
                                                      : "text-gray-500 hover:text-gray-900"
                                          }`}
                                    >
                                          {r === "7days" ? "7 Days" : r === "30days" ? "30 Days" : r}
                                    </button>
                              ))}
                        </div>

                        {/* Custom Dates & Interval Select */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                              <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    <input
                                          type="date"
                                          value={startDate}
                                          onChange={(e) => {
                                                setStartDate(e.target.value);
                                                setPresetRange("all"); // break preset
                                          }}
                                          className="px-2 py-1.5 border border-border rounded-lg text-xs text-gray-700 bg-white"
                                    />
                                    <span className="text-gray-400 text-xs">to</span>
                                    <input
                                          type="date"
                                          value={endDate}
                                          onChange={(e) => {
                                                setEndDate(e.target.value);
                                                setPresetRange("all"); // break preset
                                          }}
                                          className="px-2 py-1.5 border border-border rounded-lg text-xs text-gray-700 bg-white"
                                    />
                              </div>

                              <div className="border-l border-border h-6 hidden sm:block" />

                              <select
                                    value={interval}
                                    onChange={(e) => setIntervalVal(e.target.value as any)}
                                    className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-gray-700 bg-white cursor-pointer"
                              >
                                    <option value="daily">Daily Interval</option>
                                    <option value="weekly">Weekly Interval</option>
                                    <option value="monthly">Monthly Interval</option>
                              </select>
                        </div>
                  </div>

                  {/* KPIs Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {loading && !data ? (
                              Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-24 bg-white border border-border rounded-2xl animate-pulse" />
                              ))
                        ) : (
                              <>
                                    <StatCard
                                          icon={IndianRupee}
                                          label="Gross Revenue"
                                          value={`₹${(data?.summary.totalRevenue || 0).toLocaleString("en-IN")}`}
                                          sub={`Delivery: ₹${(data?.summary.totalDeliveryFees || 0).toLocaleString("en-IN")} · Platform: ₹${(data?.summary.totalPlatformFees || 0).toLocaleString("en-IN")}`}
                                          color="text-green-600"
                                    />
                                    <StatCard
                                          icon={ShoppingBag}
                                          label="Total Orders"
                                          value={(data?.summary.totalOrders || 0).toString()}
                                          sub="Completed deliveries"
                                          color="text-primary"
                                    />
                                    <StatCard
                                          icon={Percent}
                                          label="Platform Commission"
                                          value={`₹${(data?.summary.totalCommission || 0).toLocaleString("en-IN")}`}
                                          sub="5% revenue cut on sales"
                                          color="text-blue-600"
                                    />
                                    <StatCard
                                          icon={Clock}
                                          label="Average Order Value"
                                          value={`₹${Math.round(data?.summary.averageOrderValue || 0)}`}
                                          sub="Order basket average"
                                          color="text-yellow-600"
                                    />
                              </>
                        )}
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue & Volume Trends */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex flex-col gap-4">
                              <div>
                                    <h2 className="text-sm sm:text-base font-bold text-gray-800">Sales & Order Volume Trends</h2>
                                    <p className="text-xs text-gray-400">Total gross receipts vs count of orders</p>
                              </div>
                              <div className="h-64 sm:h-80 w-full">
                                    {loading ? (
                                          <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading charts...</div>
                                    ) : data && data.trends.length > 0 ? (
                                          <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                      <defs>
                                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                                  <stop offset="5%" stopColor="#C22630" stopOpacity={0.4} />
                                                                  <stop offset="95%" stopColor="#C22630" stopOpacity={0} />
                                                            </linearGradient>
                                                      </defs>
                                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                      <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} tickLine={false} />
                                                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                                                      <Tooltip {...customTooltipStyles} />
                                                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                                                      <Area name="Revenue (₹)" type="monotone" dataKey="revenue" stroke="#C22630" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                                                      <Area name="Orders Count" type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} fill="transparent" />
                                                </AreaChart>
                                          </ResponsiveContainer>
                                    ) : (
                                          <div className="h-full flex items-center justify-center text-xs text-gray-400">No trend data available for this range</div>
                                    )}
                              </div>
                        </div>

                        {/* Peak Delivery Hours */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex flex-col gap-4">
                              <div>
                                    <h2 className="text-sm sm:text-base font-bold text-gray-800">Peak Delivery Hours</h2>
                                    <p className="text-xs text-gray-400">Hourly density of order creation (24h clock)</p>
                              </div>
                              <div className="h-64 sm:h-80 w-full">
                                    {loading ? (
                                          <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading charts...</div>
                                    ) : data && data.peakHours.length > 0 ? (
                                          <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                      <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} tickLine={false} tickFormatter={(h) => `${h}:00`} />
                                                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                                                      <Tooltip {...customTooltipStyles} labelFormatter={(h) => `Hour: ${h}:00`} />
                                                      <Bar name="Orders placed" dataKey="ordersCount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                          </ResponsiveContainer>
                                    ) : (
                                          <div className="h-full flex items-center justify-center text-xs text-gray-400">No peak hour data available</div>
                                    )}
                              </div>
                        </div>

                        {/* User Growth Line Chart */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex flex-col gap-4">
                              <div>
                                    <h2 className="text-sm sm:text-base font-bold text-gray-800">User Growth</h2>
                                    <p className="text-xs text-gray-400">Acquisitions of customers, sellers, and riders</p>
                              </div>
                              <div className="h-64 sm:h-80 w-full">
                                    {loading ? (
                                          <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading charts...</div>
                                    ) : data && data.userGrowth.length > 0 ? (
                                          <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={data.userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                                                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                                                      <Tooltip {...customTooltipStyles} />
                                                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                                                      <Line name="New Registrations" type="monotone" dataKey="newRegistrations" stroke="#ea580c" strokeWidth={2} dot={false} />
                                                      <Line name="Total Users" type="monotone" dataKey="totalUsers" stroke="#0d9488" strokeWidth={2} dot={false} />
                                                </LineChart>
                                          </ResponsiveContainer>
                                    ) : (
                                          <div className="h-full flex items-center justify-center text-xs text-gray-400">No user growth data available</div>
                                    )}
                              </div>
                        </div>

                        {/* Top Selling Foods */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex flex-col gap-4">
                              <div>
                                    <h2 className="text-sm sm:text-base font-bold text-gray-800">Top Selling Food Items</h2>
                                    <p className="text-xs text-gray-400">Most requested dishes by quantities ordered</p>
                              </div>
                              <div className="h-64 sm:h-80 w-full">
                                    {loading ? (
                                          <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading charts...</div>
                                    ) : data && data.topFoods.length > 0 ? (
                                          <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={data.topFoods} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                                      <XAxis type="number" stroke="#9ca3af" fontSize={10} tickLine={false} />
                                                      <YAxis type="category" dataKey="name" stroke="#374151" fontSize={10} tickLine={false} width={80} />
                                                      <Tooltip {...customTooltipStyles} />
                                                      <Bar name="Quantity Sold" dataKey="quantitySold" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                          </ResponsiveContainer>
                                    ) : (
                                          <div className="h-full flex items-center justify-center text-xs text-gray-400">No menu data available</div>
                                    )}
                              </div>
                        </div>
                  </div>

                  {/* Leaderboards for Restaurants and Riders */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performing Restaurants */}
                        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col">
                              <div className="p-4 sm:p-5 border-b border-border bg-gray-50 flex items-center gap-2">
                                    <Utensils size={18} className="text-primary" />
                                    <div>
                                          <h3 className="text-sm sm:text-base font-bold text-gray-800">Top Performing Restaurants</h3>
                                          <p className="text-[10px] sm:text-xs text-gray-450">Top kitchens driving order volumes</p>
                                    </div>
                              </div>
                              <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left text-xs border-collapse">
                                          <thead>
                                                <tr className="bg-gray-100/50 text-gray-500 font-semibold uppercase tracking-wider border-b border-border">
                                                      <th className="p-4">Restaurant</th>
                                                      <th className="p-4 text-center">Orders</th>
                                                      <th className="p-4 text-right">Revenue</th>
                                                </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border text-gray-700">
                                                {loading ? (
                                                      Array.from({ length: 3 }).map((_, i) => (
                                                            <tr key={i} className="animate-pulse">
                                                                  <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-32" /></td>
                                                                  <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-12 mx-auto" /></td>
                                                                  <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-16 ml-auto" /></td>
                                                            </tr>
                                                      ))
                                                ) : data && data.topRestaurants.length > 0 ? (
                                                      data.topRestaurants.map((r, idx) => (
                                                            <tr key={r.restaurantId} className="hover:bg-gray-50">
                                                                  <td className="p-4 font-medium flex items-center gap-3">
                                                                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                              {idx + 1}
                                                                        </span>
                                                                        <span className="truncate max-w-44">{r.name}</span>
                                                                  </td>
                                                                  <td className="p-4 text-center font-semibold text-gray-500">{r.ordersCount}</td>
                                                                  <td className="p-4 text-right font-bold text-gray-950">₹{r.revenue.toLocaleString("en-IN")}</td>
                                                            </tr>
                                                      ))
                                                ) : (
                                                      <tr>
                                                            <td colSpan={3} className="p-8 text-center text-gray-400">No restaurant performance data found</td>
                                                      </tr>
                                                )}
                                          </tbody>
                                    </table>
                              </div>
                        </div>

                        {/* Top Rated Delivery Riders */}
                        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col">
                              <div className="p-4 sm:p-5 border-b border-border bg-gray-50 flex items-center gap-2">
                                    <Award size={18} className="text-yellow-500" />
                                    <div>
                                          <h3 className="text-sm sm:text-base font-bold text-gray-800">Top Rated Riders</h3>
                                          <p className="text-[10px] sm:text-xs text-gray-450">Riders with highest customer ratings</p>
                                    </div>
                              </div>
                              <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left text-xs border-collapse">
                                          <thead>
                                                <tr className="bg-gray-100/50 text-gray-500 font-semibold uppercase tracking-wider border-b border-border">
                                                      <th className="p-4">Rider</th>
                                                      <th className="p-4 text-center">Avg Rating</th>
                                                      <th className="p-4 text-center">Total Ratings</th>
                                                      <th className="p-4 text-center">Deliveries</th>
                                                </tr>
                                          </thead>
                                          <tbody className="divide-y divide-border text-gray-700">
                                                {loading ? (
                                                      Array.from({ length: 3 }).map((_, i) => (
                                                            <tr key={i} className="animate-pulse">
                                                                  <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-32" /></td>
                                                                  <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-12 mx-auto" /></td>
                                                                  <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-12 mx-auto" /></td>
                                                                  <td className="p-4"><div className="h-4 bg-gray-100 rounded-sm w-12 mx-auto" /></td>
                                                            </tr>
                                                      ))
                                                ) : data && data.riderPerformance.length > 0 ? (
                                                      data.riderPerformance.map((rider, idx) => (
                                                            <tr key={rider.riderId} className="hover:bg-gray-50">
                                                                  <td className="p-4 font-medium flex items-center gap-3">
                                                                        <span className="w-5 h-5 rounded-full bg-yellow-500/10 text-yellow-750 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                              {idx + 1}
                                                                        </span>
                                                                        <span>{rider.name}</span>
                                                                  </td>
                                                                  <td className="p-4 text-center">
                                                                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">
                                                                              ⭐ {rider.rating !== null && rider.rating !== undefined ? Number(rider.rating).toFixed(1) : "0.0"}
                                                                        </span>
                                                                  </td>
                                                                  <td className="p-4 text-center text-gray-500 font-semibold">{rider.ratingCount}</td>
                                                                  <td className="p-4 text-center text-gray-950 font-bold">{rider.totalDeliveries}</td>
                                                            </tr>
                                                      ))
                                                ) : (
                                                      <tr>
                                                            <td colSpan={4} className="p-8 text-center text-gray-400">No rider performance data found</td>
                                                      </tr>
                                                )}
                                          </tbody>
                                    </table>
                              </div>
                        </div>
                  </div>
            </div>
      );
};

export default AdminAnalytics;
