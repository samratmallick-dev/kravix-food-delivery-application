import { useState, useEffect } from "react";
import { Search, X, Ban, ShieldCheck } from "lucide-react";
import { useAdminUsers, useBlockUser, useVerifyRider } from "../hooks/useAdminQueries";
import { useAdminSocket } from "../context/AdminSocketContext";
import { useAdminApi } from "../hooks/useAdminApi";
import DataTable, { type ColumnDef } from "../components/DataTable";
import StatusChip from "../components/StatusChip";
import type { AdminUser, AdminRider, UserFilters } from "../types/admin.types";

const TABS = [
  { label: "Customers", role: "customer" },
  { label: "Sellers",   role: "seller" },
  { label: "Riders",    role: "rider" },
];

const AdminUsers = () => {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<UserFilters>({ page: 1, role: "customer" });
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [confirmBlock, setConfirmBlock] = useState<AdminUser | null>(null);
  const [riderProfile, setRiderProfile] = useState<AdminRider | null>(null);

  const api = useAdminApi();
  const { data, isLoading } = useAdminUsers(filters);
  const blockMutation = useBlockUser();
  const verifyRiderMutation = useVerifyRider();
  const { socket } = useAdminSocket();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setFilters({ page: 1, role: TABS[tab].role, search: debouncedSearch || undefined });
  }, [tab, debouncedSearch]);

  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId, isBlocked, blockedUntil }: { userId: string; isBlocked: boolean; blockedUntil: string | null }) => {
      if (selected?._id === userId) setSelected((p) => p ? { ...p, isBlocked, blockedUntil } : p);
    };
    socket.on("admin:user:blockStatusChanged", handler);
    return () => { socket.off("admin:user:blockStatusChanged", handler); };
  }, [socket, selected]);

  const handleSelectUser = async (u: AdminUser) => {
    setSelected(u);
    setRiderProfile(null);
    if (u.role === "rider") {
      try {
        const { data: rd } = await api.get("/riders", { params: { limit: 100 } });
        const found = rd.data.riders.find((r: AdminRider) => r.userId === u._id);
        setRiderProfile(found ?? null);
      } catch { /* non-critical */ }
    }
  };

  const users = data?.users ?? [];

  const columns: ColumnDef<AdminUser>[] = [
    {
      header: "User",
      accessor: "name",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <img src={u.image} alt={u.name} referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-100" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{u.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      render: (u) => (
        <div className="flex items-center gap-1.5">
          {u.isBlocked
            ? <StatusChip status="blocked" label="Blocked" />
            : <StatusChip status="active" label="Active" />}
        </div>
      ),
    },
    {
      header: "Joined",
      accessor: "createdAt",
      sortable: true,
      render: (u) => <span className="text-[11px] text-gray-400 font-mono">{new Date(u.createdAt).toLocaleDateString("en-IN")}</span>,
    },
    {
      header: "Actions",
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => handleSelectUser(u)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer">
            <ShieldCheck size={14} />
          </button>
          <button
            onClick={() => setConfirmBlock(u)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${u.isBlocked ? "hover:bg-[#1D9E75]/10 text-gray-300 hover:text-[#1D9E75]" : "hover:bg-[#E24B4A]/10 text-gray-300 hover:text-[#E24B4A]"}`}
          >
            <Ban size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-5 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-lg font-bold text-gray-800">Users</h1>
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{data?.total ?? 0} total</p>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          {TABS.map((t, i) => (
            <button
              key={t.role}
              onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${tab === i ? "bg-[#185FA5] text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-[#185FA5] transition"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <Search size={13} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs outline-none bg-transparent text-gray-700 w-48 placeholder:text-gray-300"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 cursor-pointer">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        page={data?.page ?? 1}
        pages={data?.pages ?? 1}
        total={data?.total ?? 0}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        keyExtractor={(u) => u._id}
      />

      {/* User detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label="User Details">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">User Details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-400">
                <X size={15} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <img src={selected.image} alt={selected.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100" />
              <div className="text-center">
                <p className="font-bold text-gray-800 text-sm">{selected.name}</p>
                <p className="text-xs text-gray-400">{selected.email}</p>
              </div>
            </div>
            <div className="space-y-0 divide-y divide-gray-50 text-xs">
              {[
                ["Role", selected.role ?? "unassigned"],
                ["ID", selected._id],
                ["Joined", new Date(selected.createdAt).toLocaleDateString("en-IN")],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2.5">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-mono font-medium text-gray-700 truncate max-w-[180px]">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2.5">
                <span className="text-gray-400">Status</span>
                {selected.isBlocked
                  ? <StatusChip status="blocked" label={`Blocked until ${selected.blockedUntil ? new Date(selected.blockedUntil).toLocaleDateString("en-IN") : "—"}`} />
                  : <StatusChip status="active" label="Active" />}
              </div>
              {selected.role === "rider" && riderProfile && (
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-400">Verification</span>
                  <button
                    onClick={() => verifyRiderMutation.mutate({ id: riderProfile._id, isVerified: !riderProfile.isVerified })}
                    disabled={verifyRiderMutation.isPending}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${riderProfile.isVerified ? "bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20" : "bg-[#EF9F27]/10 text-[#EF9F27] hover:bg-[#EF9F27]/20"}`}
                  >
                    {riderProfile.isVerified ? "✓ Verified" : "⏳ Pending — Click to verify"}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => { setConfirmBlock(selected); setSelected(null); }}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${selected.isBlocked ? "bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20" : "bg-[#E24B4A]/10 text-[#E24B4A] hover:bg-[#E24B4A]/20"}`}
            >
              {selected.isBlocked ? "Unsuspend User" : "Suspend User"}
            </button>
          </div>
        </div>
      )}

      {/* Confirm block modal */}
      {confirmBlock && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmBlock(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-gray-800">
              {confirmBlock.isBlocked ? "Unsuspend User?" : "Suspend User?"}
            </h2>
            <p className="text-xs text-gray-500">
              {confirmBlock.isBlocked
                ? <>Restore access for <span className="font-semibold text-gray-700">{confirmBlock.name}</span> immediately.</>
                : <>Block <span className="font-semibold text-gray-700">{confirmBlock.name}</span> for 7 days. Their role-based actions will be restricted.</>}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBlock(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => { blockMutation.mutate(confirmBlock._id); setConfirmBlock(null); }}
                disabled={blockMutation.isPending}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-semibold transition disabled:opacity-60 cursor-pointer ${confirmBlock.isBlocked ? "bg-[#1D9E75] hover:bg-[#178a64]" : "bg-[#E24B4A] hover:bg-[#c73b3a]"}`}
              >
                {confirmBlock.isBlocked ? "Unsuspend" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
