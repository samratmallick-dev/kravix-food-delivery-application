import { useEffect, useState, useCallback } from "react";
import { Users, Store, Bike, ShoppingBag, IndianRupee, CalendarDays } from "lucide-react";
import { getAdminDashboard, getAllOrders } from "@/services/api/admin.services";
import { useAdminSocket } from "@/features/admin";
import { StatCard } from "@/features/admin";
import { OrderStatusBadge } from "@/features/admin";
import toast from "react-hot-toast";
import type { IOrder } from "@/types";
import { storage } from "@/utils";

interface DashboardData {
      users: Record<string, number>;
      restaurants: { verified: number; unverified: number };
      riders: { verified: number; unverified: number };
      orders: Record<string, number>;
      totalRevenue: number;
      today: { orders: number; revenue: number };
}

interface LiveOrder {
      orderId: string;
      restaurantName: string;
      totalAmount: number;
      status: string;
      paymentMethod: string;
      createdAt: string;
}

const ACTIVE_STATUSES = new Set(["placed", "accepted", "preparing", "ready_for_rider", "rider_assigned", "picked_up"]);

const AdminDashboard = () => {

      const { socket } = useAdminSocket();
      const [stats, setStats] = useState<DashboardData | null>(null);
      const [loading, setLoading] = useState(true);
      const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);

      const fetchStats = useCallback(async () => {
            try {
                  const [dash, orders] = await Promise.all([
                        getAdminDashboard(),
                        getAllOrders({ page: 1, limit: 50 }),
                  ]);
                  setStats(dash.data);
                  const orderList: IOrder[] = Array.isArray(orders.data) ? orders.data : [];
                  setLiveOrders(
                        orderList
                              .filter((o: IOrder) => ACTIVE_STATUSES.has(o.status))
                              .map((o: IOrder) => ({
                                    orderId: o._id,
                                    restaurantName: o.restaurantName,
                                    totalAmount: o.totalAmount,
                                    status: o.status,
                                    paymentMethod: o.paymentMethod,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
                              }))
                  );
            } catch {
                  toast.error("Failed to load dashboard stats");
            } finally {
                  setLoading(false);
            }
      }, []);

      useEffect(() => {
            if (!storage.getAdminToken()) return;
            fetchStats();
            const interval = setInterval(fetchStats, 60_000);
            return () => clearInterval(interval);
      }, [fetchStats]);

      useEffect(() => {
            if (!socket) return;
            const onNew = (order: LiveOrder) => {
                  if (ACTIVE_STATUSES.has(order.status)) {
                        setLiveOrders((prev) => [order, ...prev.filter((o) => o.orderId !== order.orderId)].slice(0, 20));
                  }
                  setStats((prev) => prev ? {
                        ...prev,
                        orders: { ...prev.orders, placed: (prev.orders["placed"] ?? 0) + 1 },
                        today: { ...prev.today, orders: prev.today.orders + 1 }
                  } : prev);
                  toast.success(`New order from ${order.restaurantName}`);
            };
            const onUpdate = ({ orderId, status }: { orderId: string; status: string }) => {
                  if (ACTIVE_STATUSES.has(status)) {
                        setLiveOrders((prev) => prev.map((o) => o.orderId === orderId ? { ...o, status } : o));
                  } else {
                        setLiveOrders((prev) => prev.filter((o) => o.orderId !== orderId));
                  }
            };
            socket.on("admin:order:new", onNew);
            socket.on("order:update", onUpdate);
            return () => {
                  socket.off("admin:order:new", onNew);
                  socket.off("order:update", onUpdate);
            };
      }, [socket]);

      const Skeleton = () => <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />;

      return (
            <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                  <div>
                        <h1 className="text-lg font-bold text-gray-800">Dashboard</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Platform overview</p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {loading ? (
                              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
                        ) : stats ? (
                              <>
                                    <StatCard
                                          icon={Users} label="Total Users"
                                          value={(stats.users["customer"] ?? 0) + (stats.users["seller"] ?? 0) + (stats.users["rider"] ?? 0) + (stats.users["unassigned"] ?? 0)}
                                          sub={`customer: ${stats.users["customer"] ?? 0} · seller: ${stats.users["seller"] ?? 0} · rider: ${stats.users["rider"] ?? 0}`}
                                    />
                                    <StatCard
                                          icon={Store} label="Restaurants"
                                          value={(stats.restaurants.verified ?? 0) + (stats.restaurants.unverified ?? 0)}
                                          sub={`verified: ${stats.restaurants.verified ?? 0} · unverified: ${stats.restaurants.unverified ?? 0}`}
                                          color="text-blue-500"
                                    />
                                    <StatCard
                                          icon={Bike} label="Riders"
                                          value={(stats.riders.verified ?? 0) + (stats.riders.unverified ?? 0)}
                                          sub={`verified: ${stats.riders.verified ?? 0} · unverified: ${stats.riders.unverified ?? 0}`}
                                          color="text-purple-500"
                                    />
                                    <StatCard
                                          icon={ShoppingBag} label="Total Orders"
                                          value={Object.values(stats.orders).reduce((a, b) => a + b, 0)}
                                          sub={`delivered: ${stats.orders["delivered"] ?? 0} · cancelled: ${stats.orders["cancelled"] ?? 0}`}
                                          color="text-orange-500"
                                    />
                                    <StatCard
                                          icon={IndianRupee} label="Total Revenue"
                                          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
                                          sub="from paid orders only"
                                          color="text-green-500"
                                    />
                                    <StatCard
                                          icon={CalendarDays} label="Today"
                                          value={stats.today.orders}
                                          sub={`revenue: ₹${stats.today.revenue.toLocaleString("en-IN")}`}
                                          color="text-yellow-500"
                                    />
                              </>
                        ) : null}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                              <h2 className="text-sm font-bold text-gray-700">Live Order Feed</h2>
                              {socket && (
                                    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                                    </span>
                              )}
                        </div>
                        {liveOrders.length === 0 ? (
                              <div className="py-10 text-center text-gray-400 text-sm">Waiting for new orders...</div>
                        ) : (
                              <div className="divide-y divide-border">
                                    {liveOrders.map((o) => (
                                          <div key={o.orderId} className="px-4 py-2.5 flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                      <p className="text-sm font-medium text-gray-700 truncate">{o.restaurantName}</p>
                                                      <p className="text-xs text-gray-400 font-mono">#{o.orderId.slice(-8).toUpperCase()}</p>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                      <OrderStatusBadge status={o.status} />
                                                      <span className="text-sm font-semibold text-gray-700">₹{o.totalAmount}</span>
                                                </div>
                                          </div>
                                    ))}
                              </div>
                        )}
                  </div>
            </div>
      );
};

export default AdminDashboard;
