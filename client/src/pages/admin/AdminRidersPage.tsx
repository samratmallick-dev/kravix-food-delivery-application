import { useEffect, useState, useCallback } from "react";
import { Trash2, Eye, X } from "lucide-react";
import { getAllRiders, verifyRider, deleteRider } from "@/services/api/admin.services";
import { useAdminSocket, AdminTable, VerifyToggle } from "@/features/admin";
import toast from "react-hot-toast";

interface Rider { _id: string; userId: string; picture: string; phoneNumber: string; aadhaarNumber: string; drivingLicesce: string; panNumber?: string | null; isVerified: boolean; isAvailable: boolean; lastActiveAt: string; createdAt: string; }

const AdminRiders = () => {

      const { socket } = useAdminSocket();
      const [riders, setRiders] = useState<Rider[]>([]);
      const [loading, setLoading] = useState(true);
      const [page, setPage] = useState(1);
      const [pages, setPages] = useState(1);
      const [total, setTotal] = useState(0);
      const [verifiedFilter, setVerifiedFilter] = useState("all");
      const [availableFilter, setAvailableFilter] = useState("all");
      const [verifyLoading, setVerifyLoading] = useState<string | null>(null);
      const [selected, setSelected] = useState<Rider | null>(null);
      const [confirmDelete, setConfirmDelete] = useState<Rider | null>(null);
      const [deleting, setDeleting] = useState<string | null>(null);

      const fetchRiders = useCallback(async () => {
            setLoading(true);
            try {
                  const params: Record<string, string | number> = { page, limit: 20 };
                  if (verifiedFilter !== "all") params["isVerified"] = verifiedFilter;
                  if (availableFilter !== "all") params["isAvailable"] = availableFilter;
                  const res = await getAllRiders(params);
                  setRiders(Array.isArray(res.data) ? res.data : []);
                  setPages(res.meta?.totalPages ?? 1);
                  setTotal(res.meta?.totalItems ?? 0);
            } catch { toast.error("Failed to load riders"); }
            finally { setLoading(false); }
      }, [page, verifiedFilter, availableFilter]);

      useEffect(() => { fetchRiders(); }, [fetchRiders]);

      useEffect(() => {
            if (!socket) return;
            const onVerified = ({ riderId, isVerified }: { riderId: string; isVerified: boolean }) => {
                  setRiders((prev) => prev.map((r) => r._id === riderId ? { ...r, isVerified } : r));
            };
            const onAvailability = ({ riderId, isAvailable }: { riderId: string; isAvailable: boolean }) => {
                  setRiders((prev) => prev.map((r) => r._id === riderId ? { ...r, isAvailable } : r));
            };
            const onDeleted = ({ riderId }: { riderId: string }) => {
                  setRiders((prev) => prev.filter((r) => r._id !== riderId));
                  setTotal((t) => t - 1);
            };
            socket.on("admin:rider:verified", onVerified);
            socket.on("admin:rider:availability", onAvailability);
            socket.on("admin:rider:deleted", onDeleted);
            return () => {
                  socket.off("admin:rider:verified", onVerified);
                  socket.off("admin:rider:availability", onAvailability);
                  socket.off("admin:rider:deleted", onDeleted);
            };
      }, [socket]);

      const handleVerify = async (r: Rider) => {
            setVerifyLoading(r._id);
            try {
                  await verifyRider(r._id, true);
                  setRiders((prev) => prev.map((x) => x._id === r._id ? { ...x, isVerified: true } : x));
                  toast.success("Rider verified");
            } catch { toast.error("Failed to update verification"); }
            finally { setVerifyLoading(null); }
      };

      const handleDeclineRider = async (r: Rider) => {
            setVerifyLoading(r._id);
            try {
                  await verifyRider(r._id, false);
                  setRiders((prev) => prev.map((x) => x._id === r._id ? { ...x, isVerified: false } : x));
                  toast.success("Rider declined");
            } catch { toast.error("Failed to decline rider"); }
            finally { setVerifyLoading(null); }
      };

      const handleDelete = async (r: Rider) => {
            setDeleting(r._id);
            try {
                  await deleteRider(r._id);
                  setRiders((prev) => prev.filter((x) => x._id !== r._id));
                  setTotal((t) => t - 1);
                  toast.success("Rider deleted");
            } catch { toast.error("Failed to delete rider"); }
            finally { setDeleting(null); setConfirmDelete(null); }
      };

      const columns = [
            {
                  header: "Rider",
                  render: (r: Rider) => (
                        <div className="flex items-center gap-3">
                              <img src={r.picture || "https://ui-avatars.com/api/?name=Rider"} alt="rider" className="w-9 h-9 rounded-full object-cover shrink-0" />
                              <div>
                                    <p className="text-sm font-medium text-gray-700">{r.phoneNumber}</p>
                                    <p className="text-xs text-gray-400 font-mono">{r.userId.slice(-8).toUpperCase()}</p>
                              </div>
                        </div>
                  ),
            },
            {
                  header: "Aadhaar",
                  render: (r: Rider) => <span className="text-xs text-gray-500 font-mono">XXXX-XXXX-{r.aadhaarNumber.slice(-4)}</span>,
            },
            {
                  header: "Verification",
                  render: (r: Rider) => (
                        <div className="flex flex-col gap-1">
                              <VerifyToggle isVerified={r.isVerified} loading={verifyLoading === r._id} onToggle={() => handleVerify(r)} onDecline={() => handleDeclineRider(r)} />
                              <span className={`text-xs font-medium ${r.isAvailable ? "text-green-600" : "text-gray-400"}`}>{r.isAvailable ? "Online" : "Offline"}</span>
                        </div>
                  ),
            },
            {
                  header: "Last Active",
                  render: (r: Rider) => <span className="text-xs text-gray-500">{new Date(r.lastActiveAt).toLocaleDateString("en-IN")}</span>,
            },
            {
                  header: "Actions",
                  render: (r: Rider) => (
                        <div className="flex items-center gap-2">
                              <button onClick={() => setSelected(r)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition cursor-pointer"><Eye size={15} /></button>
                              <button onClick={() => setConfirmDelete(r)} disabled={deleting === r._id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer disabled:opacity-50"><Trash2 size={15} /></button>
                        </div>
                  ),
            },
      ];

      return (
            <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                              <h1 className="text-xl font-bold text-gray-800">Riders</h1>
                              <p className="text-sm text-gray-400 mt-0.5">{total} total riders</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                              {["all", "true", "false"].map((f) => (
                                    <button key={`v-${f}`} onClick={() => { setVerifiedFilter(f); setPage(1); }}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${verifiedFilter === f ? "bg-primary text-white" : "bg-white border border-border text-gray-500 hover:border-primary hover:text-primary"}`}>
                                          {f === "all" ? "All" : f === "true" ? "Verified" : "Unverified"}
                                    </button>
                              ))}
                              <div className="w-px bg-border" />
                              {["all", "true", "false"].map((f) => (
                                    <button key={`a-${f}`} onClick={() => { setAvailableFilter(f); setPage(1); }}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${availableFilter === f ? "bg-gray-700 text-white" : "bg-white border border-border text-gray-500 hover:border-gray-700 hover:text-gray-700"}`}>
                                          {f === "all" ? "Any Status" : f === "true" ? "Online" : "Offline"}
                                    </button>
                              ))}
                        </div>
                  </div>

                  <AdminTable columns={columns} data={riders} loading={loading} page={page} pages={pages} total={total} onPageChange={setPage} keyExtractor={(r: any) => r._id} />

                  {selected && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between">
                                          <h2 className="text-base font-bold text-gray-800">Rider Details</h2>
                                          <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={16} /></button>
                                    </div>
                                    <div className="flex flex-col items-center gap-3">
                                          <img src={selected.picture || "https://ui-avatars.com/api/?name=Rider"} alt="rider" className="w-20 h-20 rounded-full object-cover ring-4 ring-border" />
                                    </div>
                                    <div className="space-y-2 text-sm">
                                          {[
                                                ["Phone", selected.phoneNumber],
                                                ["Aadhaar", `XXXX-XXXX-${selected.aadhaarNumber.slice(-4)}`],
                                                ["License", selected.drivingLicesce],
                                                ...(selected.panNumber ? [["PAN", selected.panNumber.toUpperCase()]] : []),
                                                ["Verified", selected.isVerified ? "✅ Yes" : "⏳ Pending"],
                                                ["Status", selected.isAvailable ? "🟢 Online" : "⚫ Offline"],
                                          ].map(([label, value]) => (
                                                <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                                                      <span className="text-gray-400">{label}</span>
                                                      <span className="font-medium">{value}</span>
                                                </div>
                                          ))}
                                    </div>
                              </div>
                        </div>
                  )}

                  {confirmDelete && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                    <h2 className="text-base font-bold text-gray-800">Delete Rider?</h2>
                                    <p className="text-sm text-gray-500">This will permanently delete this rider profile.</p>
                                    <div className="flex gap-3">
                                          <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
                                          <button onClick={() => handleDelete(confirmDelete)} disabled={!!deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-60 cursor-pointer">Delete</button>
                                    </div>
                              </div>
                        </div>
                  )}
            </div>
      );
};

export default AdminRiders;
