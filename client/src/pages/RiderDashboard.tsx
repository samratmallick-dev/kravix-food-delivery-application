import { useState, useRef, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppData } from "../context/AppContext";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";
import {
  Bike,
  ImagePlus,
  Phone,
  CreditCard,
  FileText,
  MapPin,
  Loader2,
  Star,
  Package,
  VolumeX,
  LogOut,
} from "lucide-react";
import axios from "axios";
import { riderBaseUrl } from "../components/common/constant";
import type { EarningsPeriod, SortDir, SortField } from "../types/rider.types";
import {
  useRiderProfile,
  useRiderEarnings,
  useActiveDelivery,
  useIncomingOrder,
  useDeliveryHistory,
  useRiderMutations,
} from "../hooks/rider/useRiderQueries";
import LiveClock from "../components/rider/LiveClock";
import RiderStatusToggle from "../components/rider/RiderStatusToggle";
import EarningsCard from "../components/rider/EarningsCard";
import OrderIncomingBanner from "../components/rider/OrderIncomingBanner";
import DeliveryStepperCard from "../components/rider/DeliveryStepperCard";
import RecentDeliveriesTable from "../components/rider/RecentDeliveriesTable";
import EarningsBarChart from "../components/rider/EarningsBarChart";
import audio from "../assets/rider_order_alert.mp3";

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[#3a3a37] rounded-lg ${className}`} />
);

// ── Registration form (shown when no profile) ─────────────────────────────────
const RiderRegistrationForm = () => {
  const { location, locationLoading } = useAppData();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [drivingLicesce, setDrivingLicesce] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleSubmit = async () => {
    if (!location) { toast.error("Location required."); return; }
    if (!phoneNumber || !aadhaarNumber || !drivingLicesce || !image) {
      toast.error("All fields are required."); return;
    }
    const formData = new FormData();
    formData.append("phoneNumber", phoneNumber);
    formData.append("aadhaarNumber", aadhaarNumber);
    formData.append("drivingLicesce", drivingLicesce);
    formData.append("file", image);
    formData.append("latitude", String(location.latitude));
    formData.append("longitude", String(location.longitude));
    try {
      setSubmitting(true);
      const { data } = await axios.post(`${riderBaseUrl}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) {
        toast.success(data.message || "Profile created!");
        window.location.reload();
      } else {
        toast.error(data.message || "Failed.");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-[#2C2C2A] border border-[#3a3a37] rounded-2xl overflow-hidden">
        <div className="bg-[#1D9E75] px-8 py-6 flex items-center gap-3">
          <Bike className="text-white" size={26} />
          <div>
            <h1 className="text-white text-lg font-semibold">Register as Rider</h1>
            <p className="text-white/70 text-xs">Fill in your details to get started</p>
          </div>
        </div>
        <div className="px-8 py-6 space-y-4">
          <label className="block cursor-pointer group">
            <div className={`relative w-full h-40 rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors ${preview ? "border-[#1D9E75]" : "border-[#444441] hover:border-[#1D9E75]"}`}>
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#888884] group-hover:text-[#1D9E75] transition-colors">
                  <ImagePlus size={32} />
                  <span className="text-xs">Upload profile photo</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>

          {[
            { icon: Phone, label: "Phone Number", value: phoneNumber, set: setPhoneNumber, placeholder: "+91-9999999999" },
            { icon: CreditCard, label: "Aadhaar Number", value: aadhaarNumber, set: setAadhaarNumber, placeholder: "XXXX-XXXX-XXXX" },
            { icon: FileText, label: "Driving License", value: drivingLicesce, set: setDrivingLicesce, placeholder: "WB-0420110012345" },
          ].map(({ icon: Icon, label, value, set, placeholder }) => (
            <div key={label} className="space-y-1">
              <label className="text-xs font-medium text-[#888884]">{label}</label>
              <div className="flex items-center gap-2 border border-[#444441] rounded-lg px-3 py-2.5 focus-within:border-[#1D9E75] transition-colors bg-[#1e1e1c]">
                <Icon size={15} className="text-[#888884] shrink-0" />
                <input
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 outline-none text-sm text-white bg-transparent placeholder:text-[#555552]"
                />
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 bg-[#1e1e1c] border border-[#3a3a37] rounded-lg px-3 py-2.5">
            <MapPin size={14} className="text-[#1D9E75] shrink-0" />
            <span className="text-xs text-[#888884] truncate">
              {locationLoading ? "Detecting location…" : location?.formattedAddress ?? "Location unavailable"}
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || locationLoading}
            className="w-full bg-[#1D9E75] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><Bike size={16} /> Register</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Sidebar skeleton ──────────────────────────────────────────────────────────
const SidebarSkeleton = () => (
  <div className="space-y-4 p-5">
    <div className="flex flex-col items-center gap-3">
      <Skeleton className="w-20 h-20 rounded-full" />
      <Skeleton className="w-28 h-4" />
      <Skeleton className="w-16 h-3" />
    </div>
    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
  </div>
);

// ── Main dashboard (inner, uses hooks) ───────────────────────────────────────
const DashboardInner = () => {
  const { user, location, setUser, setIsAuth } = useAppData();
  const { socket } = useSocket();
  const isBlocked = !!(user?.isBlocked && user.blockedUntil && new Date(user.blockedUntil) > new Date());

  const [earningsPeriod, setEarningsPeriod] = useState<EarningsPeriod>("week");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortField>("createdAt");
  const [dir, setDir] = useState<SortDir>("desc");
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [toggling, setToggling] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  const { data: profile, isLoading: profileLoading } = useRiderProfile();
  const { data: earnings, isLoading: earningsLoading } = useRiderEarnings(earningsPeriod);
  const { data: activeDelivery } = useActiveDelivery();
  const { data: incomingOrder } = useIncomingOrder(!!profile?.isAvailable && !activeDelivery);
  const { data: historyPage, isLoading: historyLoading } = useDeliveryHistory(page, sort, dir);
  const { patchStatus, patchDeliveryStep, acceptOrder, declineOrder } = useRiderMutations();

  // Socket: join rider room + listen for order:available
  useEffect(() => {
    if (socket && user?._id) socket.emit("join:rider", user._id);
  }, [socket, user?._id]);

  const enableAudio = async () => {
    try {
      const el = new Audio(audio);
      await el.play();
      el.pause();
      el.currentTime = 0;
      audioRef.current = el;
      audioUnlockedRef.current = true;
      setAudioUnlocked(true);
      toast.success("Sound notifications enabled.");
    } catch {
      toast.error("Failed to enable sound.");
    }
  };

  const handleToggle = async () => {
    if (!location) { toast.error("Location unavailable."); return; }
    setToggling(true);
    try {
      await patchStatus.mutateAsync({
        isAvailable: !profile?.isAvailable,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      toast.success(profile?.isAvailable ? "You are now offline." : "You are now online!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update status.");
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    if (profile?.isAvailable && location) {
      await axios.patch(`${riderBaseUrl}/me/availability`, { isAvailable: false, latitude: location.latitude, longitude: location.longitude }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).catch(() => {});
    }
    localStorage.removeItem("token");
    toast.success("Logged out.");
    setUser(null);
    setIsAuth(false);
  };

  const handleSort = (field: SortField) => {
    if (sort === field) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(field); setDir("desc"); }
    setPage(1);
  };

  const handleStepUpdate = async () => {
    if (!activeDelivery) return;
    try {
      const pos = await new Promise<{ latitude: number; longitude: number }>((res, rej) =>
        navigator.geolocation.getCurrentPosition(
          (p) => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          rej,
          { enableHighAccuracy: true, timeout: 8000 }
        )
      ).catch(() => ({ latitude: location?.latitude ?? 0, longitude: location?.longitude ?? 0 }));
      await patchDeliveryStep.mutateAsync({ orderId: activeDelivery._id, ...pos });
      toast.success("Status updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update.");
    }
  };

  const city = user?.name?.split(" ")[0] ?? "Rider";

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = (
    <aside className="w-full md:w-[280px] md:min-h-screen bg-[#222220] border-r border-[#3a3a37] flex flex-col shrink-0">
      {profileLoading ? (
        <SidebarSkeleton />
      ) : profile ? (
        <>
          {/* Avatar + toggle */}
          <div className="flex flex-col items-center gap-4 p-6 border-b border-[#3a3a37]">
            <div className="relative">
              <img
                src={profile.picture}
                alt={user?.name}
                className="w-20 h-20 rounded-full object-cover object-top ring-2 ring-[#3a3a37]"
              />
              {profile.isAvailable && (
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#1D9E75] border-2 border-[#222220]" />
              )}
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{user?.name}</p>
              <p className="text-[#888884] text-xs font-mono">{profile.phoneNumber}</p>
              {!profile.isVerified && (
                <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#EF9F27]/15 text-[#EF9F27] border border-[#EF9F27]/30">
                  Pending Verification
                </span>
              )}
            </div>
            {profile.isVerified && (
              <RiderStatusToggle
                isOnline={profile.isAvailable}
                toggling={toggling}
                disabled={isBlocked || !!activeDelivery}
                onToggle={handleToggle}
              />
            )}
          </div>

          {/* Earnings summary */}
          <div className="p-4 space-y-2 border-b border-[#3a3a37]">
            <p className="text-[#888884] text-xs font-mono uppercase tracking-widest mb-3">Earnings</p>
            {earningsLoading ? (
              <>{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</>
            ) : (
              <>
                {(["today", "week", "month"] as EarningsPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setEarningsPeriod(p)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono transition ${
                      earningsPeriod === p
                        ? "bg-[#1D9E75]/15 border border-[#1D9E75]/40 text-[#1D9E75]"
                        : "bg-[#2C2C2A] border border-[#3a3a37] text-[#888884] hover:border-[#555552]"
                    }`}
                  >
                    <span className="capitalize">{p}</span>
                    <span className="font-bold">
                      {earningsPeriod === p && earnings ? `₹${earnings.total}` : "—"}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Quick stats */}
          <div className="p-4 space-y-2 border-b border-[#3a3a37]">
            <p className="text-[#888884] text-xs font-mono uppercase tracking-widest mb-3">Stats</p>
            {[
              { icon: Package, label: "Deliveries", value: historyPage?.total ?? 0, suffix: "" },
              { icon: Star, label: "Rating", value: 4.8, suffix: " ⭐" },
            ].map(({ icon: Icon, label, value, suffix }) => (
              <div key={label} className="flex items-center justify-between bg-[#2C2C2A] border border-[#3a3a37] rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-[#888884]" />
                  <span className="text-[#888884] text-xs">{label}</span>
                </div>
                <span className="text-white font-mono text-sm font-semibold">
                  {value}{suffix}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom actions */}
          <div className="p-4 mt-auto space-y-2">
            {!audioUnlocked && (
              <button
                onClick={enableAudio}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#EF9F27]/10 border border-[#EF9F27]/30 text-[#EF9F27] text-xs font-semibold hover:bg-[#EF9F27]/20 transition"
              >
                <VolumeX size={14} /> Enable Sound Alerts
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#2C2C2A] border border-[#3a3a37] text-[#888884] text-xs font-semibold hover:text-[#E24B4A] hover:border-[#E24B4A]/40 transition"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </>
      ) : null}
    </aside>
  );

  // ── Main content ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#1a1a18] font-[Outfit,sans-serif]">
      {Sidebar}

      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-[#1a1a18]/90 backdrop-blur border-b border-[#3a3a37] px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-white font-semibold text-lg">
              Hey, {city} 👋
            </h1>
            {user?.isBlocked && (
              <p className="text-[#E24B4A] text-xs mt-0.5">
                Account blocked until {new Date(user.blockedUntil!).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {profile?.isAvailable && (
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D9E75]/15 border border-[#1D9E75]/30 text-[#1D9E75] text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
                Online
              </span>
            )}
            <LiveClock />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Incoming order banner */}
          {incomingOrder && (
            <OrderIncomingBanner
              order={incomingOrder}
              onAccept={async () => {
                await acceptOrder.mutateAsync(incomingOrder.orderId);
                toast.success("Order accepted!");
              }}
              onDecline={async () => {
                await declineOrder.mutateAsync(incomingOrder.orderId);
              }}
            />
          )}

          {/* Active delivery */}
          {activeDelivery && (
            <section>
              <p className="text-[#888884] text-xs font-mono uppercase tracking-widest mb-3">
                Active Delivery
              </p>
              <DeliveryStepperCard delivery={activeDelivery} onStepUpdate={handleStepUpdate} />
            </section>
          )}

          {/* Earnings summary cards + chart */}
          <section>
            <p className="text-[#888884] text-xs font-mono uppercase tracking-widest mb-3">
              Earnings — {earningsPeriod}
            </p>
            {earningsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : earnings ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <EarningsCard label="Total" value={earnings.total} trend={earnings.trend} />
                <EarningsCard label="Deliveries" value={earnings.count} prefix="" sub="completed" />
                <div className="col-span-2 sm:col-span-1">
                  <EarningsCard
                    label="Avg / Delivery"
                    value={earnings.count > 0 ? Math.round(earnings.total / earnings.count) : 0}
                  />
                </div>
              </div>
            ) : null}
            {earnings?.breakdown && <EarningsBarChart breakdown={earnings.breakdown} />}
          </section>

          {/* Delivery history table */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#888884] text-xs font-mono uppercase tracking-widest">
                Recent Deliveries
              </p>
              {historyPage && (
                <span className="text-[#888884] text-xs font-mono">{historyPage.total} total</span>
              )}
            </div>
            {historyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : historyPage ? (
              <RecentDeliveriesTable
                items={historyPage.orders}
                total={historyPage.total}
                page={historyPage.page}
                totalPages={historyPage.totalPages}
                sort={sort}
                dir={dir}
                onSort={handleSort}
                onPage={setPage}
              />
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
};

// ── Query client (scoped to this page) ───────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// ── Page entry ────────────────────────────────────────────────────────────────
const RiderDashboard = () => {
  const { user, loading } = useAppData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <Loader2 size={32} className="text-[#1D9E75] animate-spin" />
      </div>
    );
  }

  if (user?.role !== "rider") {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <p className="text-[#E24B4A] font-semibold">Not authorized.</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RiderDashboardWithProfile />
    </QueryClientProvider>
  );
};

// Separate component so hooks run inside QueryClientProvider
const RiderDashboardWithProfile = () => {
  const { data: profile, isLoading } = useRiderProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <Loader2 size={32} className="text-[#1D9E75] animate-spin" />
      </div>
    );
  }

  if (!profile) return <RiderRegistrationForm />;

  return <DashboardInner />;
};

export default RiderDashboard;
