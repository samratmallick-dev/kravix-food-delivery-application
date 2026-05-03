import { ShoppingBag, IndianRupee, Bike, Store, Activity, Zap, Bell } from "lucide-react";
import { useAdminMetrics } from "../hooks/useAdminQueries";
import { useAdminSocket } from "../context/AdminSocketContext";
import MetricCard from "../components/MetricCard";
import StatusChip from "../components/StatusChip";
import DonutChart from "../components/charts/DonutChart";
import RevenueLineChart from "../components/charts/RevenueLineChart";
import { useState, useEffect } from "react";
import type { AdminOrder } from "../types/admin.types";

const ACTIVE = new Set(["placed", "accepted", "preparing", "ready_for_rider", "rider_assigned", "picked_up"]);

const SystemHealth = () => {
  const services = [
    { label: "API Gateway", ok: true },
    { label: "Payment Gateway", ok: true },
    { label: "Notification Service", ok: true },
  ];
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {services.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 text-xs font-medium"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-[#1D9E75] animate-pulse" : "bg-[#E24B4A]"}`} />
          <span className="text-gray-600">{s.label}</span>
          <span className={`font-semibold ${s.ok ? "text-[#1D9E75]" : "text-[#E24B4A]"}`}>{s.ok ? "OK" : "DOWN"}</span>
        </div>
      ))}
    </div>
  );
};

const AdminOverview = () => {
  const { data: metrics, isLoading } = useAdminMetrics();
  const { socket } = useAdminSocket();
  const [liveFeed, setLiveFeed] = useState<AdminOrder[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;
    const onNew = (order: AdminOrder) => {
      if (!ACTIVE.has(order.status)) return;
      setLiveFeed((prev) => [order, ...prev.filter((o) => o._id !== order._id)].slice(0, 10));
      setNewIds((prev) => new Set([...prev, order._id]));
      setTimeout(() => setNewIds((prev) => { const n = new Set(prev); n.delete(order._id); return n; }), 2000);
    };
    const onUpdate = ({ orderId, status }: { orderId: string; status: string }) => {
      if (ACTIVE.has(status)) {
        setLiveFeed((prev) => prev.map((o) => o._id === orderId ? { ...o, status: status as AdminOrder["status"] } : o));
      } else {
        setLiveFeed((prev) => prev.filter((o) => o._id !== orderId));
      }
    };
    socket.on("admin:order:new", onNew);
    socket.on("order:update", onUpdate);
    return () => { socket.off("admin:order:new", onNew); socket.off("order:update", onUpdate); };
  }, [socket]);

  return (
    <div className="p-5 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Overview</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <SystemHealth />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={ShoppingBag} label="Orders Today"
          value={metrics?.ordersToday ?? 0}
          sub="paid orders only"
          accentColor="#185FA5"
          loading={isLoading}
        />
        <MetricCard
          icon={IndianRupee} label="Revenue Today"
          value={`₹${(metrics?.revenueToday ?? 0).toLocaleString("en-IN")}`}
          sub="from completed orders"
          accentColor="#1D9E75"
          loading={isLoading}
        />
        <MetricCard
          icon={Bike} label="Active Riders"
          value={metrics?.activeRiders ?? 0}
          sub="verified riders"
          accentColor="#EF9F27"
          loading={isLoading}
        />
        <MetricCard
          icon={Store} label="Active Restaurants"
          value={metrics?.activeRestaurants ?? 0}
          sub="verified restaurants"
          accentColor="#185FA5"
          loading={isLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue line chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Revenue — Last 30 Days</h2>
            <span className="text-[11px] text-gray-400 font-mono">
              ₹{(metrics?.revenueByDay?.reduce((s, d) => s + d.revenue, 0) ?? 0).toLocaleString("en-IN")} total
            </span>
          </div>
          {isLoading ? (
            <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
          ) : (
            <RevenueLineChart data={metrics?.revenueByDay ?? []} />
          )}
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Orders by Status</h2>
          {isLoading ? (
            <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
          ) : (
            <DonutChart data={metrics?.ordersByStatus ?? {}} />
          )}
        </div>
      </div>

      {/* Live feed */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[#185FA5]" />
            <h2 className="text-sm font-bold text-gray-700">Live Order Feed</h2>
          </div>
          {socket ? (
            <span className="flex items-center gap-1.5 text-[11px] text-[#1D9E75] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> Connecting...
            </span>
          )}
        </div>

        {liveFeed.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={24} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Waiting for new orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8F8F6] border-b border-gray-100">
                  {["Order ID", "Restaurant", "Customer", "Rider", "Status", "Time", "Amount"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {liveFeed.map((o) => (
                  <tr
                    key={o._id}
                    className={`transition-colors ${newIds.has(o._id) ? "bg-[#185FA5]/5" : "hover:bg-[#F8F8F6]"}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-700 max-w-[140px] truncate">{o.restaurantName}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[120px] truncate">{o.deliveryAddress.customerName}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{o.riderName ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2.5"><StatusChip status={o.status} /></td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-400 font-mono">
                      {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-700 font-mono">₹{o.totalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
