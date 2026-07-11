import { useEffect, useState } from "react";
import { fetchEarnings } from "../../utils/rider.api";
import { TrendingUp, Star, Package, Loader2, IndianRupee } from "lucide-react";
import type { IRiderEarnings } from "../../types/types";


const EarningsDashboard = () => {
      const [earnings, setEarnings] = useState<IRiderEarnings | null>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
            fetchEarnings()
                  .then((res) => setEarnings(res.data as any))
                  .catch(() => setEarnings(null))
                  .finally(() => setLoading(false));
      }, []);

      if (loading) return (
            <div className="flex items-center justify-center py-8">
                  <Loader2 size={22} className="animate-spin text-primary" />
            </div>
      );

      if (!earnings) return null;

      const maxAmount = Math.max(...earnings.weeklyBreakdown.map((d) => d.amount), 1);
      const CHART_H = 80; 

      return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 space-y-5">
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" /> Earnings Overview
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-50 rounded-xl p-3 space-y-0.5">
                              <p className="text-xs text-gray-500">Today</p>
                              <p className="text-lg font-bold text-green-700 flex items-center gap-0.5">
                                    <IndianRupee size={14} />{earnings.todayEarnings}
                              </p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 space-y-0.5">
                              <p className="text-xs text-gray-500">This Week</p>
                              <p className="text-lg font-bold text-blue-700 flex items-center gap-0.5">
                                    <IndianRupee size={14} />{earnings.weekEarnings}
                              </p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-3 space-y-0.5">
                              <p className="text-xs text-gray-500">Total Earned</p>
                              <p className="text-lg font-bold text-purple-700 flex items-center gap-0.5">
                                    <IndianRupee size={14} />{earnings.totalEarnings}
                              </p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3 space-y-0.5">
                              <p className="text-xs text-gray-500 flex items-center gap-1"><Package size={11} /> Deliveries</p>
                              <p className="text-lg font-bold text-orange-700">{earnings.totalDeliveries}</p>
                        </div>
                  </div>

                  {earnings.rating !== null && (
                        <div className="flex items-center gap-2 bg-yellow-50 rounded-xl px-4 py-3">
                              <Star size={16} className="text-yellow-500 fill-yellow-400" />
                              <span className="text-sm font-semibold text-yellow-800">Rating: {earnings.rating} / 5</span>
                        </div>
                  )}

                  <div>
                        <p className="text-xs font-semibold text-gray-500 mb-3">Last 7 Days</p>
                        <div className="flex items-end gap-1.5" style={{ height: CHART_H }}>
                              {earnings.weeklyBreakdown.map(({ date, amount }) => {
                                    const barH = amount === 0 ? 3 : Math.max((amount / maxAmount) * CHART_H, 6);
                                    return (
                                          <div
                                                key={date}
                                                className="flex-1 rounded-t-md transition-all duration-500"
                                                style={{ height: barH, backgroundColor: amount === 0 ? "#e5e7eb" : "#C22630" }}
                                                title={`₹${amount}`}
                                          />
                                    );
                              })}
                        </div>
                        <div className="flex gap-1.5 mt-1">
                              {earnings.weeklyBreakdown.map(({ date }) => {
                                    const [year, month, day] = date.split("-");
                                    const label = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-IN", { weekday: "short" });
                                    return (
                                          <span key={date} className="flex-1 text-center text-[9px] text-gray-400 leading-none">{label}</span>
                                    );
                              })}
                        </div>
                  </div>
            </div>
      );
};

export default EarningsDashboard;
