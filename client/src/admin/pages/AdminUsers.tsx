import { useEffect, useState, useCallback } from "react";
import { Trash2, Eye, X, ShieldCheck } from "lucide-react";
import { useAdminApi } from "../hooks/useAdminApi";
import { useAdminSocket } from "../context/AdminSocketContext";
import AdminTable from "../components/AdminTable";
import VerifyToggle from "../components/VerifyToggle";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface User { _id: string; name: string; email: string; image: string; role: string | null; createdAt: string; }
interface RiderProfile { _id: string; userId: string; isVerified: boolean; }

const ROLES = ["all", "customer", "seller", "rider", "null"];

const AdminUsers = () => {
      const api = useAdminApi();
      const { socket } = useAdminSocket();
      const [users, setUsers] = useState<User[]>([]);
      const [loading, setLoading] = useState(true);
      const [page, setPage] = useState(1);
      const [pages, setPages] = useState(1);
      const [total, setTotal] = useState(0);
      const [roleFilter, setRoleFilter] = useState("all");
      const [selected, setSelected] = useState<User | null>(null);
      const [deleting, setDeleting] = useState<string | null>(null);
      const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
      const [verifyLoading, setVerifyLoading] = useState<string | null>(null);
      const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
      const navigate = useNavigate();

      const handleSelectUser = async (u: User) => {
            setSelected(u);
            setRiderProfile(null);
            if (u.role === "rider") {
                  try {
                        const { data } = await api.get("/riders", { params: { limit: 100 } });
                        const found = data.data.riders.find((r: RiderProfile) => r.userId === u._id);
                        setRiderProfile(found ?? null);
                  } catch { /* non-critical */ }
            }
      };

      const handleVerifyRider = async () => {
            if (!riderProfile) return;
            setVerifyLoading(riderProfile._id);
            try {
                  await api.patch(`/riders/${riderProfile._id}/verify`, { isVerified: !riderProfile.isVerified });
                  toast.success(`Rider ${!riderProfile.isVerified ? "verified" : "unverified"}`);
                  setRiderProfile((prev) => prev ? { ...prev, isVerified: !prev.isVerified } : prev);
            } catch { toast.error("Failed to update rider verification"); }
            finally { setVerifyLoading(null); }
      };

      const fetchUsers = useCallback(async () => {
            setLoading(true);
            try {
                  const params: Record<string, string | number> = { page, limit: 20 };
                  if (roleFilter !== "all") params["role"] = roleFilter;
                  const { data } = await api.get("/users", { params });
                  setUsers(data.data.users);
                  setPages(data.data.pages);
                  setTotal(data.data.total);
            } catch { toast.error("Failed to load users"); }
            finally { setLoading(false); }
      }, [api, page, roleFilter]);

      useEffect(() => { fetchUsers(); }, [fetchUsers]);

      useEffect(() => {
            if (!socket) return;
            const handler = ({ userId }: { userId: string }) => {
                  setUsers((prev) => prev.filter((u) => u._id !== userId));
                  setTotal((t) => t - 1);
            };
            socket.on("admin:user:deleted", handler);
            return () => { socket.off("admin:user:deleted", handler); };
      }, [socket]);

      const handleDelete = async (user: User) => {
            setDeleting(user._id);
            try {
                  await api.delete(`/users/${user._id}`);
                  setUsers((prev) => prev.filter((u) => u._id !== user._id));
                  setTotal((t) => t - 1);
                  toast.success("User deleted");
            } catch { toast.error("Failed to delete user"); }
            finally { setDeleting(null); setConfirmDelete(null); }
      };

      const columns = [
            {
                  header: "User",
                  render: (u: User) => (
                        <div className="flex items-center gap-3">
                              <img src={u.image} alt={u.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />
                              <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{u.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              </div>
                        </div>
                  ),
            },
            {
                  header: "Role",
                  render: (u: User) => (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              u.role === "customer" ? "bg-blue-100 text-blue-700"
                              : u.role === "seller" ? "bg-purple-100 text-purple-700"
                              : u.role === "rider" ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-500"
                        }`}>{u.role ?? "unassigned"}</span>
                  ),
            },
            {
                  header: "Joined",
                  render: (u: User) => <span className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString("en-IN")}</span>,
            },
            {
                  header: "Actions",
                  render: (u: User) => (
                        <div className="flex items-center gap-2">
                              <button onClick={() => handleSelectUser(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition cursor-pointer">
                                    <Eye size={15} />
                              </button>
                              <button onClick={() => setConfirmDelete(u)} disabled={deleting === u._id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer disabled:opacity-50">
                                    <Trash2 size={15} />
                              </button>
                        </div>
                  ),
            },
      ];

      return (
            <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                              <h1 className="text-xl font-bold text-gray-800">Users</h1>
                              <p className="text-sm text-gray-400 mt-0.5">{total} total users</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                              {ROLES.map((r) => (
                                    <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${roleFilter === r ? "bg-primary text-white" : "bg-white border border-border text-gray-500 hover:border-primary hover:text-primary"}`}>
                                          {r === "all" ? "All" : r === "null" ? "Unassigned" : r.charAt(0).toUpperCase() + r.slice(1)}
                                    </button>
                              ))}
                        </div>
                  </div>

                  <AdminTable columns={columns} data={users} loading={loading} page={page} pages={pages} total={total} onPageChange={setPage} keyExtractor={(u) => u._id} />

                  {selected && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between">
                                          <h2 className="text-base font-bold text-gray-800">User Details</h2>
                                          <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={16} /></button>
                                    </div>
                                    <div className="flex flex-col items-center gap-3">
                                          <img src={selected.image} alt={selected.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-border" />
                                          <div className="text-center">
                                                <p className="font-bold text-gray-800">{selected.name}</p>
                                                <p className="text-sm text-gray-400">{selected.email}</p>
                                          </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                          <div className="flex justify-between py-2 border-b border-border"><span className="text-gray-400">Role</span><span className="font-medium">{selected.role ?? "unassigned"}</span></div>
                                          <div className="flex justify-between py-2 border-b border-border"><span className="text-gray-400">ID</span><span className="font-mono text-xs text-gray-600">{selected._id}</span></div>
                                          <div className="flex justify-between py-2 border-b border-border"><span className="text-gray-400">Joined</span><span className="font-medium">{new Date(selected.createdAt).toLocaleDateString("en-IN")}</span></div>
                                          {selected.role === "rider" && (
                                                <div className="flex justify-between items-center py-2 border-b border-border">
                                                      <span className="text-gray-400">Verification</span>
                                                      {riderProfile ? (
                                                            <VerifyToggle
                                                                  isVerified={riderProfile.isVerified}
                                                                  loading={verifyLoading === riderProfile._id}
                                                                  onToggle={handleVerifyRider}
                                                            />
                                                      ) : (
                                                            <span className="text-xs text-gray-400">No profile yet</span>
                                                      )}
                                                </div>
                                          )}
                                          {selected.role === "seller" && (
                                                <div className="flex justify-between items-center py-2">
                                                      <span className="text-gray-400">Restaurant</span>
                                                      <button
                                                            onClick={() => { setSelected(null); navigate("/admin/restaurants"); }}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition cursor-pointer"
                                                      >
                                                            <ShieldCheck size={12} /> Verify in Restaurants
                                                      </button>
                                                </div>
                                          )}
                                    </div>
                              </div>
                        </div>
                  )}

                  {confirmDelete && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                    <h2 className="text-base font-bold text-gray-800">Delete User?</h2>
                                    <p className="text-sm text-gray-500">This will permanently delete <span className="font-semibold text-gray-700">{confirmDelete.name}</span>. This action cannot be undone.</p>
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

export default AdminUsers;
