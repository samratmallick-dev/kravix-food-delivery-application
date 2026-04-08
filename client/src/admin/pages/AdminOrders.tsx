import { useEffect, useState, useCallback } from "react";
import { Eye, X, Ban } from "lucide-react";
import { useAdminApi } from "../hooks/useAdminApi";
import { useAdminSocket } from "../context/AdminSocketContext";
import AdminTable from "../components/AdminTable";
import OrderStatusBadge from "../components/OrderStatusBadge";
import toast from "react-hot-toast";
import type { IOrder } from "../../types/types";

const STATUS_OPTIONS = ["", "placed", "accepted", "preparing", "ready_for_rider", "rider_assigned", "picked_up", "delivered", "cancelled"];
const PAYMENT_OPTIONS = ["", "pending", "paid", "failed"];

const AdminOrders = () => {
      const api = useAdminApi();
      const { socket } = useAdminSocket();
      const [orders, setOrders] = useState<IOrder[]>([]);
      const [loading, setLoading] = useState(true);
      const [page, setPage] = useState(1);
      const [pages, setPages] = useState(1);
      const [total, setTotal] = useState(0);
      const [statusFilter, setStatusFilter] = useState("");
      const [paymentFilter, setPaymentFilter] = useState("paid");
      const [fromDate, setFromDate] = useState("");
      const [toDate, setToDate] = useState("");
      const [selected, setSelected] = useState<IOrder | null>(null);
      const [cancelling, setCancelling] = useState<string | null>(null);
      const [confirmCancel, setConfirmCancel] = useState<IOrder | null>(null);

      const fetchOrders = useCallback(async () => {
            setLoading(true);
            try {
                  const params: Record<string, string | number> = { page, limit: 20 };
                  if (statusFilter) params["status"] = statusFilter;
                  if (paymentFilter) params["paymentStatus"] = paymentFilter;
                  if (fromDate) params["from"] = fromDate;
                  if (toDate) params["to"] = toDate;
                  const { data } = await api.get("/orders", { params });
                  setOrders(data.data.orders);
                  setPages(data.data.pages);
                  setTotal(data.data.total);
            } catch { toast.error("Failed to load orders"); }
            finally { setLoading(false); }
      }, [api, page, statusFilter, paymentFilter, fromDate, toDate]);

      useEffect(() => { fetchOrders(); }, [fetchOrders]);

      useEffect(() => {
            if (!socket) return;
            const handler = ({ orderId, status }: { orderId: string; status: string }) => {
                  setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: status as IOrder["status"] } : o));
                  if (selected?._id === orderId) setSelected((prev) => prev ? { ...prev, status: status as IOrder["status"] } : prev);
            };
            socket.on("order:update", handler);
            return () => { socket.off("order:update", handler); };
      }, [socket, selected]);

      const handleCancel = async (order: IOrder) => {
            setCancelling(order._id);
            try {
                  await api.patch(`/orders/${order._id}/cancel`);
                  setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, status: "cancelled" } : o));
                  toast.success("Order cancelled");
            } catch { toast.error("Failed to cancel order"); }
            finally { setCancelling(null); setConfirmCancel(null); }
      };

      const canCancel = (status: string) => !["cancelled", "delivered"].includes(status);

      const columns = [
            {
                  header: "Order",
                  render: (o: IOrder) => (
                        <div>
                              <p className="text-xs font-mono text-gray-500">#{o._id.slice(-8).toUpperCase()}</p>
                              <p className="text-sm font-medium text-gray-700 truncate max-w-35">{o.restaurantName}</p>
                        </div>
                  ),
            },
            {
                  header: "Amount",
                  render: (o: IOrder) => (
                        <div>
                              <p className="text-sm font-semibold text-gray-700">₹{o.totalAmount}</p>
                              <span className={`text-xs font-medium ${o.paymentStatus === "paid" ? "text-green-600" : o.paymentStatus === "failed" ? "text-red-500" : "text-yellow-600"}`}>{o.paymentStatus}</span>
                        </div>
                  ),
            },
            {
                  header: "Status",
                  render: (o: IOrder) => <OrderStatusBadge status={o.status} />,
            },
            {
                  header: "Date",
                  render: (o: IOrder) => <span className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>,
            },
            {
                  header: "Actions",
                  render: (o: IOrder) => (
                        <div className="flex items-center gap-2">
                              <button onClick={() => setSelected(o)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition cursor-pointer"><Eye size={15} /></button>
                              {canCancel(o.status) && (
                                    <button onClick={() => setConfirmCancel(o)} disabled={cancelling === o._id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer disabled:opacity-50"><Ban size={15} /></button>
                              )}
                        </div>
                  ),
            },
      ];

      return (
            <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                              <h1 className="text-xl font-bold text-gray-800">Orders</h1>
                              <p className="text-sm text-gray-400 mt-0.5">{total} total orders</p>
                        </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-3">
                        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="text-xs border border-border rounded-lg px-3 py-2 text-gray-600 outline-none focus:border-primary cursor-pointer">
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
                        </select>
                        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }} className="text-xs border border-border rounded-lg px-3 py-2 text-gray-600 outline-none focus:border-primary cursor-pointer">
                              {PAYMENT_OPTIONS.map((p) => <option key={p} value={p}>{p || "All Payments"}</option>)}
                        </select>
                        <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 focus-within:border-primary">
                              <span className="text-xs text-gray-400 shrink-0">From</span>
                              <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="text-xs text-gray-600 outline-none cursor-pointer bg-transparent" />
                        </div>
                        <div className="flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 focus-within:border-primary">
                              <span className="text-xs text-gray-400 shrink-0">To</span>
                              <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="text-xs text-gray-600 outline-none cursor-pointer bg-transparent" />
                        </div>
                        {(statusFilter || paymentFilter || fromDate || toDate) && (
                              <button onClick={() => { setStatusFilter(""); setPaymentFilter(""); setFromDate(""); setToDate(""); setPage(1); }} className="text-xs text-primary font-semibold hover:underline cursor-pointer">Clear filters</button>
                        )}
                  </div>

                  <AdminTable columns={columns} data={orders} loading={loading} page={page} pages={pages} total={total} onPageChange={setPage} keyExtractor={(o) => o._id} />

                  {selected && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                    <div className="sticky top-0 bg-white px-6 py-4 border-b border-border flex items-center justify-between">
                                          <h2 className="text-base font-bold text-gray-800">Order #{selected._id.slice(-8).toUpperCase()}</h2>
                                          <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={16} /></button>
                                    </div>
                                    <div className="p-6 space-y-4 text-sm">
                                          <div className="flex items-center gap-3 flex-wrap">
                                                <OrderStatusBadge status={selected.status} />
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${selected.paymentStatus === "paid" ? "bg-green-100 text-green-700" : selected.paymentStatus === "failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{selected.paymentStatus}</span>
                                                <span className="text-xs text-gray-400">{selected.paymentMethod}</span>
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                                {[
                                                      ["Restaurant", selected.restaurantName],
                                                      ["Rider", selected.riderName ?? "Not assigned"],
                                                      ["Subtotal", `₹${selected.subtotal}`],
                                                      ["Delivery Fee", `₹${selected.deliveryFee}`],
                                                      ["Platform Fee", `₹${selected.platformFee}`],
                                                      ["Total", `₹${selected.totalAmount}`],
                                                ].map(([label, value]) => (
                                                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                                                            <p className="text-xs text-gray-400">{label}</p>
                                                            <p className="font-semibold text-gray-700 mt-0.5">{value}</p>
                                                      </div>
                                                ))}
                                          </div>
                                          <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery Address</p>
                                                <p className="text-sm text-gray-600">{selected.deliveryAddress.formatedAddress}</p>
                                                <p className="text-xs text-gray-400 mt-1">{selected.deliveryAddress.customerName} · {selected.deliveryAddress.mobile}</p>
                                          </div>
                                          <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items ({selected.items.length})</p>
                                                <div className="space-y-1.5">
                                                      {selected.items.map((item, i) => (
                                                            <div key={i} className="flex justify-between">
                                                                  <span className="text-gray-600">{item.name} × {item.quantity}</span>
                                                                  <span className="font-medium text-gray-700">₹{item.price * item.quantity}</span>
                                                            </div>
                                                      ))}
                                                </div>
                                          </div>
                                          {canCancel(selected.status) && (
                                                <button onClick={() => { setSelected(null); setConfirmCancel(selected); }} className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition cursor-pointer">
                                                      Force Cancel Order
                                                </button>
                                          )}
                                    </div>
                              </div>
                        </div>
                  )}

                  {confirmCancel && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmCancel(null)}>
                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                    <h2 className="text-base font-bold text-gray-800">Force Cancel Order?</h2>
                                    <p className="text-sm text-gray-500">Order <span className="font-mono font-semibold">#{confirmCancel._id.slice(-8).toUpperCase()}</span> will be cancelled. Customer, restaurant and rider will be notified.</p>
                                    <div className="flex gap-3">
                                          <button onClick={() => setConfirmCancel(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">Back</button>
                                          <button onClick={() => handleCancel(confirmCancel)} disabled={!!cancelling} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-60 cursor-pointer">Cancel Order</button>
                                    </div>
                              </div>
                        </div>
                  )}
            </div>
      );
};

export default AdminOrders;
