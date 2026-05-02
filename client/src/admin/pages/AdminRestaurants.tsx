import { useState } from "react";
import { LayoutGrid, List, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import {
  useAdminRestaurants, useAdminRestaurantDetail,
  useVerifyRestaurant, useDeleteRestaurant, useUpdateRestaurant,
} from "../hooks/useAdminQueries";
import DataTable, { type ColumnDef } from "../components/DataTable";
import StatusChip from "../components/StatusChip";
import Drawer from "../components/Drawer";
import type { AdminRestaurant, RestaurantFilters } from "../types/admin.types";

const FILTERS = [
  { label: "All",        value: "all" },
  { label: "Verified",   value: "true" },
  { label: "Unverified", value: "false" },
];

const RestaurantCard = ({
  r, onView, onVerify, onDelete, verifyLoading, deleteLoading,
}: {
  r: AdminRestaurant;
  onView: () => void;
  onVerify: () => void;
  onDelete: () => void;
  verifyLoading: boolean;
  deleteLoading: boolean;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden"
    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
    <div className="relative">
      <img src={r.image} alt={r.name} className="w-full h-32 object-cover" />
      <div className="absolute top-2 right-2 flex gap-1">
        <StatusChip status={r.isVerified ? "verified" : "unverified"} label={r.isVerified ? "Verified" : "Pending"} />
        <StatusChip status={r.isOpen ? "online" : "offline"} label={r.isOpen ? "Open" : "Closed"} />
      </div>
    </div>
    <div className="p-3 space-y-2">
      <p className="text-sm font-bold text-gray-800 truncate">{r.name}</p>
      <p className="text-[11px] text-gray-400 line-clamp-2">{r.description || "No description"}</p>
      <div className="flex items-center gap-1.5 pt-1">
        <button onClick={onView}
          className="flex-1 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-600 hover:border-[#185FA5] hover:text-[#185FA5] transition cursor-pointer flex items-center justify-center gap-1">
          <Eye size={12} /> View
        </button>
        <button onClick={onVerify} disabled={verifyLoading}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 ${r.isVerified ? "border border-[#E24B4A]/30 text-[#E24B4A] hover:bg-[#E24B4A]/5" : "bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20"}`}>
          {r.isVerified ? <><XCircle size={12} /> Unverify</> : <><CheckCircle size={12} /> Verify</>}
        </button>
        <button onClick={onDelete} disabled={deleteLoading}
          className="p-1.5 rounded-lg hover:bg-[#E24B4A]/10 text-gray-300 hover:text-[#E24B4A] transition cursor-pointer disabled:opacity-50">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  </div>
);

const AdminRestaurants = () => {
  const [filters, setFilters] = useState<RestaurantFilters>({ page: 1 });
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminRestaurant | null>(null);

  const { data, isLoading } = useAdminRestaurants(filters);
  const { data: detail, isLoading: detailLoading } = useAdminRestaurantDetail(selectedId);
  const verifyMutation = useVerifyRestaurant();
  const deleteMutation = useDeleteRestaurant();
  const updateMutation = useUpdateRestaurant();

  const restaurants = data?.restaurants ?? [];

  const columns: ColumnDef<AdminRestaurant>[] = [
    {
      header: "Restaurant",
      accessor: "name",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <img src={r.image} alt={r.name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{r.name}</p>
            <p className="text-[11px] text-gray-400">📞 {r.phone}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Verification",
      render: (r) => <StatusChip status={r.isVerified ? "verified" : "unverified"} label={r.isVerified ? "Verified" : "Pending"} />,
    },
    {
      header: "Status",
      render: (r) => <StatusChip status={r.isOpen ? "online" : "offline"} label={r.isOpen ? "Open" : "Closed"} />,
    },
    {
      header: "Created",
      accessor: "createdAt",
      sortable: true,
      render: (r) => <span className="text-[11px] text-gray-400 font-mono">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>,
    },
    {
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSelectedId(r._id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer">
            <Eye size={14} />
          </button>
          <button
            onClick={() => verifyMutation.mutate({ id: r._id, isVerified: !r.isVerified })}
            disabled={verifyMutation.isPending}
            className={`p-1.5 rounded-lg transition cursor-pointer disabled:opacity-50 ${r.isVerified ? "hover:bg-[#E24B4A]/10 text-gray-300 hover:text-[#E24B4A]" : "hover:bg-[#1D9E75]/10 text-gray-300 hover:text-[#1D9E75]"}`}
          >
            {r.isVerified ? <XCircle size={14} /> : <CheckCircle size={14} />}
          </button>
          <button onClick={() => setConfirmDelete(r)} disabled={deleteMutation.isPending}
            className="p-1.5 rounded-lg hover:bg-[#E24B4A]/10 text-gray-300 hover:text-[#E24B4A] transition cursor-pointer disabled:opacity-50">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-5 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Restaurants</h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{data?.total ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {FILTERS.map((f) => (
              <button key={f.value}
                onClick={() => setFilters({ page: 1, isVerified: f.value === "all" ? undefined : f.value })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${(filters.isVerified ?? "all") === f.value ? "bg-[#185FA5] text-white" : "text-gray-500 hover:text-gray-700"}`}>
                {f.label}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <button onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "list" ? "bg-[#185FA5] text-white" : "text-gray-400 hover:text-gray-600"}`}>
              <List size={14} />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === "grid" ? "bg-[#185FA5] text-white" : "text-gray-400 hover:text-gray-600"}`}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <DataTable
          columns={columns}
          data={restaurants}
          loading={isLoading}
          page={data?.page ?? 1}
          pages={data?.pages ?? 1}
          total={data?.total ?? 0}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          keyExtractor={(r) => r._id}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-32 bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            : restaurants.map((r) => (
                <RestaurantCard
                  key={r._id}
                  r={r}
                  onView={() => setSelectedId(r._id)}
                  onVerify={() => verifyMutation.mutate({ id: r._id, isVerified: !r.isVerified })}
                  onDelete={() => setConfirmDelete(r)}
                  verifyLoading={verifyMutation.isPending}
                  deleteLoading={deleteMutation.isPending}
                />
              ))}
        </div>
      )}

      {/* Restaurant detail drawer */}
      <Drawer open={!!selectedId} onClose={() => setSelectedId(null)} title={detail?.restaurant.name ?? "Restaurant Details"}>
        {detailLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-40 bg-gray-100 rounded-xl" />
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
          </div>
        ) : detail ? (
          <div className="space-y-4 text-sm">
            <img src={detail.restaurant.image} alt={detail.restaurant.name}
              className="w-full h-40 object-cover rounded-xl" />
            <p className="text-xs text-gray-500">{detail.restaurant.description || "No description"}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Phone", String(detail.restaurant.phone)],
                ["Verified", detail.restaurant.isVerified ? "Yes" : "No"],
                ["Status", detail.restaurant.isOpen ? "Open" : "Closed"],
                ["Created", new Date(detail.restaurant.createdAt).toLocaleDateString("en-IN")],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#F8F8F6] rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="font-semibold text-gray-700 mt-0.5 text-xs">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Menu Items ({detail.menuItems.length})
              </p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {detail.menuItems.length === 0 ? (
                  <p className="text-xs text-gray-400">No menu items</p>
                ) : detail.menuItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="font-mono text-xs font-semibold text-gray-700">₹{item.price}</span>
                      <StatusChip status={item.isAvailable ? "active" : "suspended"} label={item.isAvailable ? "Available" : "Unavailable"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { if (detail) updateMutation.mutate({ id: detail.restaurant._id, values: { isVerified: !detail.restaurant.isVerified } }); }}
                disabled={updateMutation.isPending}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${detail.restaurant.isVerified ? "bg-[#E24B4A]/10 text-[#E24B4A] hover:bg-[#E24B4A]/20" : "bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20"}`}
              >
                {detail.restaurant.isVerified ? "Unverify Restaurant" : "Approve Restaurant"}
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-gray-800">Delete Restaurant?</h2>
            <p className="text-xs text-gray-500">
              Permanently delete <span className="font-semibold text-gray-700">{confirmDelete.name}</span> and all its menu items.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => { deleteMutation.mutate(confirmDelete._id); setConfirmDelete(null); }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#E24B4A] hover:bg-[#c73b3a] text-white text-xs font-semibold transition disabled:opacity-60 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRestaurants;
