import { useState } from "react";
import { Ban, Eye, ChevronDown } from "lucide-react";
import { useAdminOrders, useCancelOrder } from "../hooks/useAdminQueries";
import { useAdminSocket } from "../context/AdminSocketContext";
import { useEffect } from "react";
import DataTable, { type ColumnDef } from "../components/DataTable";
import StatusChip from "../components/StatusChip";
import Drawer from "../components/Drawer";
import ExportCSVButton from "../components/ExportCSVButton";
import type { AdminOrder, OrderFilters } from "../types/admin.types";

const STATUS_OPTIONS = ["", "placed", "accepted", "preparing", "ready_for_rider", "rider_assigned", "picked_up", "out_for_delivery", "delivered", "cancelled"];
const PAYMENT_OPTIONS = ["", "pending", "paid", "failed"];

const OrderTimeline = ({ order }: { order: AdminOrder }) => {
  const steps: AdminOrder["status"][] = ["placed", "accepted", "preparing", "ready_for_rider", "rider_assigned", "picked_up", "delivered"];
  const currentIdx = steps.indexOf(order.status);
  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const done = i <= currentIdx && order.status !== "cancelled";
        const active = i === currentIdx && order.status !== "cancelled";
        return (
          <div key={step} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shrink-0 ${active ? "bg-[#185FA5] ring-2 ring-[#185FA5]/30" : done ? "bg-[#1D9E75]" : "bg-gray-200"}`} />
            <span className={`text-xs ${active ? "font-semibold text-[#185FA5]" : done ? "text-gray-600" : "text-gray-300"}`}>
              {step.replace(/_/g, " ")}
            </span>
          </div>
        );
      })}
      {order.status === "cancelled" && (
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#E24B4A] shrink-0" />
          <span className="text-xs font-semibold text-[#E24B4A]">Cancelled</span>
        </div>
      )}
    </div>
  );
};

const AdminOrders = () => {
  const [filters, setFilters] = useState<OrderFilters>({ page: 1, paymentStatus: "paid" });
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<AdminOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useAdminOrders(filters);
  const cancelMutation = useCancelOrder();
  const { socket } = useAdminSocket();

  useEffect(() => {
    if (!socket) return;
    const handler = ({ orderId, status }: { orderId: string; status: string }) => {
      if (selected?._id === orderId) setSelected((p) => p ? { ...p, status: status as AdminOrder["status"] } : p);
    };
    socket.on("order:update", handler);
    return () => { socket.off("order:update", handler); };
  }, [socket, selected]);

  const setFilter = (key: keyof OrderFilters, val: string) =>
    setFilters((f) => ({ ...f, [key]: val, page: 1 }));

  const canCancel = (s: string) => !["cancelled", "delivered"].includes(s);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkCancel = async () => {
    await Promise.allSettled([...selectedIds].map((id) => cancelMutation.mutateAsync(id)));
    setSelectedIds(new Set());
    refetch();
  };

  const orders = data?.orders ?? [];

  const columns: ColumnDef<AdminOrder>[] = [
    {
      header: "",
      render: (o) => (
        <input type="checkbox" checked={selectedIds.has(o._id)} onChange={() => toggleSelect(o._id)}
          className="w-3.5 h-3.5 accent-[#185FA5] cursor-pointer" />
      ),
    },
    {
      header: "Order ID",
      accessor: "_id",
      render: (o) => <span className="font-mono text-[11px] text-gray-500">#{o._id.slice(-8).toUpperCase()}</span>,
    },
    {
      header: "Restaurant",
      accessor: "restaurantName",
      sortable: true,
      render: (o) => <span className="text-xs font-medium text-gray-700 max-w-[140px] truncate block">{o.restaurantName}</span>,
    },
    {
      header: "Customer",
      render: (o) => <span className="text-xs text-gray-500">{o.deliveryAddress.customerName}</span>,
    },
    {
      header: "Rider",
      render: (o) => <span className="text-xs text-gray-500">{o.riderName ?? <span className="text-gray-300">—</span>}</span>,
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (o) => <StatusChip status={o.status} />,
    },
    {
      header: "Payment",
      render: (o) => <StatusChip status={o.paymentStatus} label={o.paymentStatus} />,
    },
    {
      header: "Amount",
      accessor: "totalAmount",
      sortable: true,
      render: (o) => <span className="font-mono text-xs font-semibold text-gray-700">₹{o.totalAmount.toLocaleString("en-IN")}</span>,
    },
    {
      header: "Date",
      accessor: "createdAt",
      sortable: true,
      render: (o) => <span className="text-[11px] text-gray-400 font-mono">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>,
    },
    {
      header: "Actions",
      render: (o) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSelected(o)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer">
            <Eye size={14} />
          </button>
          {canCancel(o.status) && (
            <button onClick={() => setConfirmCancel(o)}
              className="p-1.5 rounded-lg hover:bg-[#E24B4A]/10 text-gray-300 hover:text-[#E24B4A] transition cursor-pointer">
              <Ban size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-5 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{data?.total ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkCancel}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#E24B4A]/10 text-[#E24B4A] text-xs font-semibold hover:bg-[#E24B4A]/20 transition cursor-pointer disabled:opacity-50"
            >
              <Ban size={13} /> Cancel {selectedIds.size} selected
            </button>
          )}
          <ExportCSVButton
            data={orders}
            filename="orders"
            columns={[
              { header: "Order ID", accessor: (o) => o._id },
              { header: "Restaurant", accessor: (o) => o.restaurantName },
              { header: "Customer", accessor: (o) => o.deliveryAddress.customerName },
              { header: "Rider", accessor: (o) => o.riderName ?? "" },
              { header: "Status", accessor: (o) => o.status },
              { header: "Payment", accessor: (o) => o.paymentStatus },
              { header: "Amount", accessor: (o) => o.totalAmount },
              { header: "Date", accessor: (o) => o.createdAt },
            ]}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-wrap gap-2"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="relative">
          <select
            value={filters.status ?? ""}
            onChange={(e) => setFilter("status", e.target.value)}
            className="appearance-none text-xs border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-gray-600 outline-none focus:border-[#185FA5] cursor-pointer bg-white"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "All Statuses"}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filters.paymentStatus ?? ""}
            onChange={(e) => setFilter("paymentStatus", e.target.value)}
            className="appearance-none text-xs border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-gray-600 outline-none focus:border-[#185FA5] cursor-pointer bg-white"
          >
            {PAYMENT_OPTIONS.map((p) => <option key={p} value={p}>{p || "All Payments"}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-[#185FA5]">
          <span className="text-[11px] text-gray-400">From</span>
          <input type="date" value={filters.from ?? ""} onChange={(e) => setFilter("from", e.target.value)}
            className="text-xs text-gray-600 outline-none cursor-pointer bg-transparent" />
        </div>
        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-[#185FA5]">
          <span className="text-[11px] text-gray-400">To</span>
          <input type="date" value={filters.to ?? ""} onChange={(e) => setFilter("to", e.target.value)}
            className="text-xs text-gray-600 outline-none cursor-pointer bg-transparent" />
        </div>
        {(filters.status || filters.paymentStatus || filters.from || filters.to) && (
          <button
            onClick={() => setFilters({ page: 1 })}
            className="text-xs text-[#185FA5] font-semibold hover:underline cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={isLoading}
        page={data?.page ?? 1}
        pages={data?.pages ?? 1}
        total={data?.total ?? 0}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        keyExtractor={(o) => o._id}
      />

      {/* Order detail drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={`Order #${selected?._id.slice(-8).toUpperCase() ?? ""}`}>
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="flex flex-wrap gap-2">
              <StatusChip status={selected.status} />
              <StatusChip status={selected.paymentStatus} label={selected.paymentStatus} />
              <span className="text-[11px] text-gray-400 font-mono self-center">{selected.paymentMethod}</span>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Timeline</p>
              <OrderTimeline order={selected} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["Restaurant", selected.restaurantName],
                ["Rider", selected.riderName ?? "Not assigned"],
                ["Subtotal", `₹${selected.subtotal}`],
                ["Delivery Fee", `₹${selected.deliveryFee}`],
                ["Platform Fee", `₹${selected.platformFee}`],
                ["Total", `₹${selected.totalAmount}`],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#F8F8F6] rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="font-semibold text-gray-700 mt-0.5 text-xs font-mono">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Delivery Address</p>
              <p className="text-xs text-gray-600">{selected.deliveryAddress.formatedAddress}</p>
              <p className="text-[11px] text-gray-400 mt-1 font-mono">
                {selected.deliveryAddress.customerName} · {selected.deliveryAddress.mobile}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Items ({selected.items.length})</p>
              <div className="space-y-1.5">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.name} × {item.quantity}</span>
                    <span className="font-mono font-semibold text-gray-700">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {canCancel(selected.status) && (
              <button
                onClick={() => { setSelected(null); setConfirmCancel(selected); }}
                className="w-full py-2.5 rounded-xl bg-[#E24B4A] hover:bg-[#c73b3a] text-white text-xs font-semibold transition cursor-pointer"
              >
                Force Cancel Order
              </button>
            )}
          </div>
        )}
      </Drawer>

      {/* Confirm cancel modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmCancel(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-gray-800">Cancel Order?</h2>
            <p className="text-xs text-gray-500">
              Order <span className="font-mono font-semibold">#{confirmCancel._id.slice(-8).toUpperCase()}</span> will be cancelled.
              All parties will be notified.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCancel(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer">
                Back
              </button>
              <button
                onClick={() => { cancelMutation.mutate(confirmCancel._id); setConfirmCancel(null); }}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#E24B4A] hover:bg-[#c73b3a] text-white text-xs font-semibold transition disabled:opacity-60 cursor-pointer"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
