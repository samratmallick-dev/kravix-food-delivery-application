import { useEffect, useState, useCallback } from "react";
import { Trash2, Eye, X } from "lucide-react";
import { getAllRestaurants, getRestaurantById, verifyRestaurant, deleteRestaurant, approveLocationUpdate, rejectLocationUpdate } from "../../utils/admin.api";
import { useAdminSocket } from "../context/AdminSocketContext";
import AdminTable from "../components/AdminTable";
import VerifyToggle from "../components/VerifyToggle";
import toast from "react-hot-toast";

interface Location { address: string; city: string; state: string; country: string; pincode: string; landmark?: string; latitude: number; longitude: number; deliveryRadius: number; }
interface Restaurant { _id: string; name: string; ownerId: string; phone: number; isVerified: boolean; isOpen: boolean; image: string; description: string; createdAt: string; location?: Location; pendingLocation?: Location; locationReviewStatus?: "PENDING" | "APPROVED" | "REJECTED" | null; locationVersion?: number; }
interface MenuItem { _id: string; name: string; price: number; isAvailable: boolean; description: string; }

const AdminRestaurants = () => {

      const { socket } = useAdminSocket();
      const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
      const [loading, setLoading] = useState(true);
      const [page, setPage] = useState(1);
      const [pages, setPages] = useState(1);
      const [total, setTotal] = useState(0);
      const [filter, setFilter] = useState("all");
      const [verifyLoading, setVerifyLoading] = useState<string | null>(null);
      const [selected, setSelected] = useState<{ restaurant: Restaurant; menuItems: MenuItem[] } | null>(null);
      const [confirmDelete, setConfirmDelete] = useState<Restaurant | null>(null);
      const [deleting, setDeleting] = useState<string | null>(null);
      const [rejectingLocation, setRejectingLocation] = useState<Restaurant | null>(null);
      const [rejectReason, setRejectReason] = useState("");
      const [reviewActionLoading, setReviewActionLoading] = useState(false);

      const fetchRestaurants = useCallback(async () => {
            setLoading(true);
            try {
                  const params: Record<string, string | number> = { page, limit: 20 };
                  if (filter !== "all") params["isVerified"] = filter;
                  const res = await getAllRestaurants(params);
                  setRestaurants(Array.isArray(res.data) ? res.data : []);
                  setPages(res.meta?.totalPages ?? 1);
                  setTotal(res.meta?.total ?? 0);
            } catch { toast.error("Failed to load restaurants"); }
            finally { setLoading(false); }
      }, [page, filter]);

      useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

      useEffect(() => {
            console.log("Admin Socket in AdminRestaurants.tsx:", socket ? "Initialized" : "Null", socket?.connected ? "Connected" : "Disconnected");
            if (!socket) return;
            const onVerified = ({ restaurantId, isVerified }: { restaurantId: string; isVerified: boolean }) => {
                  setRestaurants((prev) => prev.map((r) => r._id === restaurantId ? { ...r, isVerified } : r));
            };
            const onStatus = ({ restaurantId, isOpen }: { restaurantId: string; isOpen: boolean }) => {
                  setRestaurants((prev) => prev.map((r) => r._id === restaurantId ? { ...r, isOpen } : r));
            };
            const onDeleted = ({ restaurantId }: { restaurantId: string }) => {
                  setRestaurants((prev) => prev.filter((r) => r._id !== restaurantId));
                  setTotal((t) => t - 1);
            };
            const onLocationPending = ({ restaurantId, locationReviewStatus }: { restaurantId: string; locationReviewStatus: "PENDING" | "APPROVED" | "REJECTED" | null }) => {
                  console.log("onLocationPending event received for restaurant:", restaurantId, "status:", locationReviewStatus);
                  setRestaurants((prev) => prev.map((r) => r._id === restaurantId ? { ...r, locationReviewStatus } : r));
                  if (selected && selected.restaurant._id === restaurantId) {
                        handleView(selected.restaurant);
                  }
            };
            const onLocationApproved = ({ restaurantId }: { restaurantId: string }) => {
                  console.log("onLocationApproved event received for restaurant:", restaurantId);
                  setRestaurants((prev) => prev.map((r) => r._id === restaurantId ? { ...r, locationReviewStatus: "APPROVED", pendingLocation: undefined } : r));
                  if (selected && selected.restaurant._id === restaurantId) {
                        handleView(selected.restaurant);
                  }
            };
            const onLocationRejected = ({ restaurantId }: { restaurantId: string }) => {
                  console.log("onLocationRejected event received for restaurant:", restaurantId);
                  setRestaurants((prev) => prev.map((r) => r._id === restaurantId ? { ...r, locationReviewStatus: "REJECTED", pendingLocation: undefined } : r));
                  if (selected && selected.restaurant._id === restaurantId) {
                        handleView(selected.restaurant);
                  }
            };
            socket.on("admin:restaurant:verified", onVerified);
            socket.on("admin:restaurant:status", onStatus);
            socket.on("admin:restaurant:deleted", onDeleted);
            socket.on("restaurant:location_review_pending", onLocationPending);
            socket.on("admin:restaurant:location_approved", onLocationApproved);
            socket.on("admin:restaurant:location_rejected", onLocationRejected);
            return () => {
                  socket.off("admin:restaurant:verified", onVerified);
                  socket.off("admin:restaurant:status", onStatus);
                  socket.off("admin:restaurant:deleted", onDeleted);
                  socket.off("restaurant:location_review_pending", onLocationPending);
                  socket.off("admin:restaurant:location_approved", onLocationApproved);
                  socket.off("admin:restaurant:location_rejected", onLocationRejected);
            };
      }, [socket, selected]);

      const handleVerify = async (r: Restaurant) => {
            setVerifyLoading(r._id);
            try {
                  await verifyRestaurant(r._id, true);
                  setRestaurants((prev) => prev.map((x) => x._id === r._id ? { ...x, isVerified: true } : x));
                  toast.success("Restaurant verified");
            } catch { toast.error("Failed to update verification"); }
            finally { setVerifyLoading(null); }
      };

      const handleDeclineRestaurant = async (r: Restaurant) => {
            setVerifyLoading(r._id);
            try {
                  await verifyRestaurant(r._id, false);
                  setRestaurants((prev) => prev.map((x) => x._id === r._id ? { ...x, isVerified: false } : x));
                  toast.success("Restaurant declined");
            } catch { toast.error("Failed to decline restaurant"); }
            finally { setVerifyLoading(null); }
      };

      const handleDelete = async (r: Restaurant) => {
            setDeleting(r._id);
            try {
                  await deleteRestaurant(r._id);
                  setRestaurants((prev) => prev.filter((x) => x._id !== r._id));
                  setTotal((t) => t - 1);
                  toast.success("Restaurant deleted");
            } catch { toast.error("Failed to delete restaurant"); }
            finally { setDeleting(null); setConfirmDelete(null); }
      };

      const handleView = async (r: Restaurant) => {
            try {
                  const res = await getRestaurantById(r._id);
                  setSelected({ restaurant: res.data.restaurant, menuItems: res.data.menuItems });
            } catch { toast.error("Failed to load restaurant details"); }
      };

      const handleApproveLocation = async (r: Restaurant) => {
            setReviewActionLoading(true);
            try {
                  const res = await approveLocationUpdate(r._id, { locationVersion: r.locationVersion });
                  toast.success("Location update approved successfully");
                  setRestaurants((prev) => prev.map((x) => x._id === r._id ? { ...x, ...res.data } : x));
                  if (selected && selected.restaurant._id === r._id) {
                        setSelected((prev) => prev ? { ...prev, restaurant: { ...prev.restaurant, ...res.data } } : null);
                  }
            } catch (err: any) {
                  toast.error(err.message || "Failed to approve location update");
            } finally {
                  setReviewActionLoading(false);
            }
      };

      const handleRejectLocation = async (r: Restaurant, reason: string) => {
            setReviewActionLoading(true);
            try {
                  const res = await rejectLocationUpdate(r._id, { reason, locationVersion: r.locationVersion });
                  toast.success("Location update rejected");
                  setRestaurants((prev) => prev.map((x) => x._id === r._id ? { ...x, ...res.data } : x));
                  if (selected && selected.restaurant._id === r._id) {
                        setSelected((prev) => prev ? { ...prev, restaurant: { ...prev.restaurant, ...res.data } } : null);
                  }
            } catch (err: any) {
                  toast.error(err.message || "Failed to reject location update");
            } finally {
                  setReviewActionLoading(false);
                  setRejectingLocation(null);
                  setRejectReason("");
            }
      };

      const columns = [
            {
                  header: "Restaurant",
                  render: (r: Restaurant) => (
                        <div className="flex items-center gap-3">
                              <img src={r.image} alt={r.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                              <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{r.name}</p>
                                    <p className="text-xs text-gray-400">📞 {r.phone}</p>
                              </div>
                        </div>
                  ),
            },
            {
                  header: "Status",
                  render: (r: Restaurant) => (
                        <div className="flex flex-col gap-1">
                              <VerifyToggle isVerified={r.isVerified} loading={verifyLoading === r._id} onToggle={() => handleVerify(r)} onDecline={() => handleDeclineRestaurant(r)} />
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    <span className={`text-xs font-medium ${r.isOpen ? "text-green-600" : "text-gray-400"}`}>{r.isOpen ? "Open" : "Closed"}</span>
                                    {r.locationReviewStatus === "PENDING" && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                Location Review
                                          </span>
                                    )}
                              </div>
                        </div>
                  ),
            },
            {
                  header: "Created",
                  render: (r: Restaurant) => <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>,
            },
            {
                  header: "Actions",
                  render: (r: Restaurant) => (
                        <div className="flex items-center gap-2">
                              <button onClick={() => handleView(r)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition cursor-pointer"><Eye size={15} /></button>
                              <button onClick={() => setConfirmDelete(r)} disabled={deleting === r._id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition cursor-pointer disabled:opacity-50"><Trash2 size={15} /></button>
                        </div>
                  ),
            },
      ];

      return (
            <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                              <h1 className="text-xl font-bold text-gray-800">Restaurants</h1>
                              <p className="text-sm text-gray-400 mt-0.5">{total} total restaurants</p>
                        </div>
                        <div className="flex gap-2">
                              {["all", "true", "false"].map((f) => (
                                    <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${filter === f ? "bg-primary text-white" : "bg-white border border-border text-gray-500 hover:border-primary hover:text-primary"}`}>
                                          {f === "all" ? "All" : f === "true" ? "Verified" : "Unverified"}
                                    </button>
                              ))}
                        </div>
                  </div>

                  <AdminTable columns={columns} data={restaurants} loading={loading} page={page} pages={pages} total={total} onPageChange={setPage} keyExtractor={(r) => r._id} />

                  {selected && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                    <div className="sticky top-0 bg-white px-6 py-4 border-b border-border flex items-center justify-between">
                                          <h2 className="text-base font-bold text-gray-800">{selected.restaurant.name}</h2>
                                          <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={16} /></button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                          <img src={selected.restaurant.image} alt={selected.restaurant.name} className="w-full h-40 object-cover rounded-xl" />
                                          <p className="text-sm text-gray-500">{selected.restaurant.description || "No description"}</p>
                                          <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Phone</p><p className="font-medium">{selected.restaurant.phone}</p></div>
                                                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400">Verified</p><p className={`font-semibold ${selected.restaurant.isVerified ? "text-green-600" : "text-yellow-600"}`}>{selected.restaurant.isVerified ? "Yes" : "No"}</p></div>
                                          </div>
                                          {selected.restaurant.locationReviewStatus === "PENDING" && selected.restaurant.pendingLocation && (
                                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                                                      <h4 className="text-sm font-bold text-amber-800">📍 Pending Location Update Request</h4>
                                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                  <p className="font-semibold text-gray-500 mb-1">Current Location:</p>
                                                                  {selected.restaurant.location ? (
                                                                        <div className="text-gray-600 bg-white border border-gray-100 rounded-lg p-2.5 space-y-1">
                                                                              <p>{selected.restaurant.location.address}</p>
                                                                              <p>{selected.restaurant.location.city}, {selected.restaurant.location.state}</p>
                                                                              <p>{selected.restaurant.location.pincode}, {selected.restaurant.location.country}</p>
                                                                              <p className="text-[10px] text-gray-400">Radius: {selected.restaurant.location.deliveryRadius}m</p>
                                                                        </div>
                                                                  ) : (
                                                                        <p className="text-gray-400 italic">No approved location set yet</p>
                                                                  )}
                                                            </div>
                                                            <div>
                                                                  <p className="font-semibold text-amber-800 mb-1">Requested Location:</p>
                                                                  <div className="text-amber-950 bg-amber-100/50 border border-amber-200/50 rounded-lg p-2.5 space-y-1">
                                                                        <p>{selected.restaurant.pendingLocation.address}</p>
                                                                        <p>{selected.restaurant.pendingLocation.city}, {selected.restaurant.pendingLocation.state}</p>
                                                                        <p>{selected.restaurant.pendingLocation.pincode}, {selected.restaurant.pendingLocation.country}</p>
                                                                        {selected.restaurant.pendingLocation.landmark && <p>Landmark: {selected.restaurant.pendingLocation.landmark}</p>}
                                                                        <p className="text-[10px] text-amber-700">Radius: {selected.restaurant.pendingLocation.deliveryRadius}m</p>
                                                                  </div>
                                                            </div>
                                                      </div>
                                                      <div className="flex gap-2 justify-end pt-1">
                                                            <button onClick={() => setRejectingLocation(selected.restaurant)} disabled={reviewActionLoading} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-lg transition cursor-pointer disabled:opacity-50">
                                                                  Decline Update
                                                            </button>
                                                            <button onClick={() => handleApproveLocation(selected.restaurant)} disabled={reviewActionLoading} className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 text-xs font-semibold rounded-lg transition cursor-pointer disabled:opacity-50">
                                                                  Approve Update
                                                            </button>
                                                      </div>
                                                </div>
                                          )}
                                          <div>
                                                <h3 className="text-sm font-bold text-gray-700 mb-2">Menu Items ({selected.menuItems.length})</h3>
                                                <div className="space-y-2">
                                                      {selected.menuItems.length === 0 ? (
                                                            <p className="text-xs text-gray-400">No menu items</p>
                                                      ) : selected.menuItems.map((item) => (
                                                            <div key={item._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                                                  <div>
                                                                        <p className="text-sm font-medium text-gray-700">{item.name}</p>
                                                                        <p className="text-xs text-gray-400">{item.description}</p>
                                                                  </div>
                                                                  <div className="text-right shrink-0 ml-4">
                                                                        <p className="text-sm font-semibold text-gray-700">₹{item.price}</p>
                                                                        <p className={`text-xs ${item.isAvailable ? "text-green-500" : "text-red-400"}`}>{item.isAvailable ? "Available" : "Unavailable"}</p>
                                                                  </div>
                                                            </div>
                                                      ))}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                  )}

                  {confirmDelete && (
                                                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
                                                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                                                    <h2 className="text-base font-bold text-gray-800">Delete Restaurant?</h2>
                                                                    <p className="text-sm text-gray-500">This will permanently delete <span className="font-semibold text-gray-700">{confirmDelete.name}</span> and all its menu items.</p>
                                                                    <div className="flex gap-3">
                                                                          <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
                                                                          <button onClick={() => handleDelete(confirmDelete)} disabled={!!deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-60 cursor-pointer">Delete</button>
                                                                    </div>
                                                              </div>
                                                        </div>
                  )}

                  {rejectingLocation && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejectingLocation(null)}>
                              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                                    <h2 className="text-base font-bold text-gray-800">Decline Location Update?</h2>
                                    <p className="text-sm text-gray-500">Please provide a reason for declining the location update request for <span className="font-semibold text-gray-700">{rejectingLocation.name}</span>.</p>
                                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for decline..." className="w-full text-sm border border-border rounded-xl p-3 focus:outline-none focus:border-primary min-h-[80px]" />
                                    <div className="flex gap-3">
                                          <button onClick={() => { setRejectingLocation(null); setRejectReason(""); }} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
                                          <button onClick={() => handleRejectLocation(rejectingLocation, rejectReason)} disabled={!rejectReason.trim()} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-60 cursor-pointer">Decline</button>
                                    </div>
                              </div>
                        </div>
                  )}
            </div>
      );
};

export default AdminRestaurants;
