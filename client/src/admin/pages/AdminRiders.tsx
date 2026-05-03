import { useState } from "react";
import { Trash2, Eye, X } from "lucide-react";
import { useAdminRiders, useVerifyRider, useDeleteRider } from "../hooks/useAdminQueries";
import { useAdminSocket } from "../context/AdminSocketContext";
import { useEffect } from "react";
import DataTable, { type ColumnDef } from "../components/DataTable";
import StatusChip from "../components/StatusChip";
import type { AdminRider } from "../types/admin.types";

const AdminRiders = () => {
  const [filters, setFilters] = useState({ page: 1, isVerified: "all", isAvailable: "all" });
  const [selected, setSelected] = useState<AdminRider | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminRider | null>(null);

  const { data, isLoading } = useAdminRiders(filters);
  const verifyMutation = useVerifyRider();
  const deleteMutation = useDeleteRider();
  const { socket } = useAdminSocket();

  useEffect(() => {
    if (!socket) return;
    const onVerified = ({ riderId, isVerified }: { riderId: string; isVerified: boolean }) => {
      if (selected?._id === riderId) setSelected((p) => p ? { ...p, isVerified } : p);
    };
    socket.on("admin:rider:verified", onVerified);
    return () => { socket.off("admin:rider:verified", onVerified); };
  }, [socket, selected]);

  const riders = data?.riders ?? [];

  const columns: ColumnDef<AdminRider>[] = [
    {
      header: "Rider",
      render: (r) => (
        <div className="flex items-center gap-3">
          <img
            src={r.picture || `https://ui-avatars.com/api/?name=R&background=185FA5&color=fff`}
            alt="rider"
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100"
          />
          <div>
            <p className="text-xs font-semibold text-gray-700">{r.phoneNumber}</p>
            <p className="text-[11px] text-gray-400 font-mono">{r.userId.slice(-8).toUpperCase()}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Aadhaar",
      render: (r) => <span className="text-[11px] text-gray-500 font-mono">XXXX-XXXX-{r.aadhaarNumber.slice(-4)}</span>,
    },
    {
      header: "Verification",
      render: (r) => <StatusChip status={r.isVerified ? "verified" : "unverified"} label={r.isVerified ? "Verified" : "Pending"} />,
    },
    {
      header: "Availability",
      render: (r) => <StatusChip status={r.isAvailable ? "online" : "offline"} label={r.isAvailable ? "Online" : "Offline"} />,
    },
    {
      header: "Last Active",
      accessor: "lastActiveAt",
      sortable: true,
      render: (r) => <span className="text-[11px] text-gray-400 font-mono">{new Date(r.lastActiveAt).toLocaleDateString("en-IN")}</span>,
    },
    {
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSelected(r)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer">
            <Eye size={14} />
          </button>
          <button
            onClick={() => verifyMutation.mutate({ id: r._id, isVerified: !r.isVerified })}
            disabled={verifyMutation.isPending}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 ${r.isVerified ? "bg-[#E24B4A]/10 text-[#E24B4A] hover:bg-[#E24B4A]/20" : "bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20"}`}
          >
            {r.isVerified ? "Unverify" : "Verify"}
          </button>
          <button onClick={() => setConfirmDelete(r)} disabled={deleteMutation.isPending}
            className="p-1.5 rounded-lg hover:bg-[#E24B4A]/10 text-gray-300 hover:text-[#E24B4A] transition cursor-pointer disabled:opacity-50">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const FilterPills = ({ label, options, value, onChange }: {
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-gray-400 font-medium">{label}:</span>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${value === o.value ? "bg-[#185FA5] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-[#185FA5] hover:text-[#185FA5]"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-5 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-bold text-gray-800">Riders</h1>
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{data?.total ?? 0} total</p>
      </div>

      <div className="flex flex-wrap gap-4 bg-white rounded-xl border border-gray-100 p-3"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <FilterPills
          label="Verification"
          options={[{ label: "All", value: "all" }, { label: "Verified", value: "true" }, { label: "Unverified", value: "false" }]}
          value={filters.isVerified}
          onChange={(v) => setFilters((f) => ({ ...f, isVerified: v, page: 1 }))}
        />
        <div className="w-px bg-gray-100" />
        <FilterPills
          label="Status"
          options={[{ label: "Any", value: "all" }, { label: "Online", value: "true" }, { label: "Offline", value: "false" }]}
          value={filters.isAvailable}
          onChange={(v) => setFilters((f) => ({ ...f, isAvailable: v, page: 1 }))}
        />
      </div>

      <DataTable
        columns={columns}
        data={riders}
        loading={isLoading}
        page={data?.page ?? 1}
        pages={data?.pages ?? 1}
        total={data?.total ?? 0}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        keyExtractor={(r) => r._id}
      />

      {/* Rider detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">Rider Details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-400">
                <X size={15} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <img
                src={selected.picture || `https://ui-avatars.com/api/?name=R&background=185FA5&color=fff`}
                alt="rider"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
              />
            </div>
            <div className="space-y-0 divide-y divide-gray-50 text-xs">
              {[
                ["Phone", selected.phoneNumber],
                ["Aadhaar", `XXXX-XXXX-${selected.aadhaarNumber.slice(-4)}`],
                ["License", selected.drivingLicesce],
                ["User ID", selected.userId.slice(-12)],
                ["Last Active", new Date(selected.lastActiveAt).toLocaleDateString("en-IN")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2.5">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-mono font-medium text-gray-700">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2.5">
                <span className="text-gray-400">Verification</span>
                <StatusChip status={selected.isVerified ? "verified" : "unverified"} label={selected.isVerified ? "Verified" : "Pending"} />
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-gray-400">Availability</span>
                <StatusChip status={selected.isAvailable ? "online" : "offline"} label={selected.isAvailable ? "Online" : "Offline"} />
              </div>
            </div>
            <button
              onClick={() => { verifyMutation.mutate({ id: selected._id, isVerified: !selected.isVerified }); setSelected(null); }}
              disabled={verifyMutation.isPending}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${selected.isVerified ? "bg-[#E24B4A]/10 text-[#E24B4A] hover:bg-[#E24B4A]/20" : "bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20"}`}
            >
              {selected.isVerified ? "Unverify Rider" : "Verify Rider"}
            </button>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-gray-800">Delete Rider?</h2>
            <p className="text-xs text-gray-500">This will permanently delete this rider profile.</p>
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

export default AdminRiders;
