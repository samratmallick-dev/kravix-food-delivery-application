import { memo, Suspense, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Footer } from "@/components/layout";
import { useAppData } from "../context/AppContext";
import { useRiderProfile } from "@/features/rider";
import { useSocket } from "../context/SocketContext";
import { useSocketOrders } from "@/features/rider";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Wallet,
  User,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bike,
  Menu,
  X,
} from "lucide-react";
import { DashboardSkeleton } from "@/features/rider";
import { addRiderProfile } from "@/services/api/rider.services";
import toast from "react-hot-toast";
import { Phone, CreditCard, MapPin, ImagePlus, Loader2 } from "lucide-react";

const NAV_ITEMS = [
  { to: "/rider/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rider/orders", label: "Orders", icon: Package },
  { to: "/rider/earnings", label: "Earnings", icon: TrendingUp },
  { to: "/rider/wallet", label: "Wallet", icon: Wallet },
  { to: "/rider/profile", label: "Profile", icon: User },
  { to: "/rider/documents", label: "Documents", icon: FileText },
  { to: "/rider/settings", label: "Settings", icon: Settings },
];

const BOTTOM_NAV = NAV_ITEMS.slice(0, 5);

const RegistrationForm = ({
  fetchProfile,
}: {
  fetchProfile: () => Promise<void>;
}) => {
  const { location, locationLoading } = useAppData();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [drivingLicesce, setDrivingLicesce] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!location) {
      toast.error("Location data is required.");
      return;
    }
    if (!phoneNumber || !aadhaarNumber || !drivingLicesce || !image) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setSubmitting(true);
      await addRiderProfile({
        phoneNumber,
        aadhaarNumber,
        drivingLicesce,
        ...(panNumber && { panNumber: panNumber.toUpperCase() }),
        image,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      toast.success("Rider profile created successfully.");
      await fetchProfile();
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-(--shadow-lg) overflow-hidden">
        <div
          className="px-8 py-6"
          style={{ background: "var(--gradient-rider)" }}
        >
          <div className="flex items-center gap-3">
            <Bike className="text-white" size={28} />
            <div>
              <h1 className="text-white text-xl font-bold">
                Add Rider Profile
              </h1>
              <p className="text-red-200 text-sm">
                Fill in your details to register as a rider
              </p>
            </div>
          </div>
        </div>
        <div className="px-8 py-6 space-y-5">
          <label className="block cursor-pointer group">
            <div
              className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-colors overflow-hidden flex items-center justify-center ${preview ? "border-primary" : "border-gray-300 hover:border-primary"}`}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
                  <ImagePlus size={36} />
                  <span className="text-sm font-medium">
                    Click to upload profile photo
                  </span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setImage(f);
                setPreview((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return f ? URL.createObjectURL(f) : null;
                });
              }}
            />
          </label>
          {[
            {
              label: "Phone Number",
              value: phoneNumber,
              onChange: setPhoneNumber,
              icon: <Phone size={16} />,
              placeholder: "+91-9999999999",
            },
            {
              label: "Aadhaar Number",
              value: aadhaarNumber,
              onChange: setAadhaarNumber,
              icon: <CreditCard size={16} />,
              placeholder: "XXXX-XXXX-XXXX",
            },
            {
              label: "Driving License",
              value: drivingLicesce,
              onChange: setDrivingLicesce,
              icon: <FileText size={16} />,
              placeholder: "WB-0420110012345",
            },
            {
              label: "PAN Number",
              value: panNumber,
              onChange: setPanNumber,
              icon: <CreditCard size={16} />,
              placeholder: "ABCDE1234F",
            },
          ].map(({ label, value, onChange, icon, placeholder }) => (
            <div key={label} className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {label} <span className="text-primary">*</span>
              </label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
                <span className="text-gray-400 shrink-0">{icon}</span>
                <input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 outline-none text-sm text-gray-700 bg-transparent uppercase"
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <MapPin size={16} className="text-primary shrink-0" />
            <span className="text-sm text-gray-600 truncate">
              {locationLoading
                ? "Detecting location..."
                : (location?.formattedAddress ?? "Location not available")}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || locationLoading}
            className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating
                Profile...
              </>
            ) : (
              <>
                <Bike size={18} /> Add Rider Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const RiderSidebar = memo(
  ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-gray-100 shadow-(--shadow-sm) z-30 transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-gray-50 ${collapsed ? "justify-center" : ""}`}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--gradient-rider)" }}
        >
          <Bike size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-gray-800 text-sm">Kravix Rider</span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2" aria-label="Rider navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-red-50 text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"} ${collapsed ? "justify-center" : ""}`
            }
            aria-label={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex items-center justify-center p-3 border-t border-gray-50 text-gray-400 hover:text-gray-600 transition"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  ),
);

const RiderTopBar = memo(
  ({
    mobileMenuOpen,
    onMobileMenuToggle,
  }: {
    mobileMenuOpen: boolean;
    onMobileMenuToggle: () => void;
  }) => (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between lg:hidden">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--gradient-rider)" }}
        >
          <Bike size={14} className="text-white" />
        </div>
        <span className="font-bold text-gray-800 text-sm">Kravix Rider</span>
      </div>
      <button
        onClick={onMobileMenuToggle}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </header>
  ),
);

const MobileDrawer = memo(
  ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-(--shadow-lg) transition-transform duration-300 lg:hidden ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-bold text-gray-800">Menu</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <nav
          className="py-4 px-3 space-y-1"
          aria-label="Mobile rider navigation"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? "bg-red-50 text-primary" : "text-gray-600 hover:bg-gray-50"}`
              }
            >
              <Icon size={17} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  ),
);

const RiderBottomNav = memo(() => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-t border-gray-100 flex lg:hidden"
    aria-label="Bottom navigation"
  >
    {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold transition min-h-14 ${isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"}`
        }
        aria-label={label}
      >
        {({ isActive }) => (
          <>
            <Icon size={20} className={isActive ? "text-primary" : ""} />
            <span>{label}</span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
));

const RiderLayout = () => {
  const { user } = useAppData();
  const { profile, setProfile, loading, fetchProfile } = useRiderProfile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (socket) {
      if (user?._id) socket.emit("join:rider", user._id);
      if (profile?._id) socket.emit("join:rider", profile._id);
    }
  }, [socket, user?._id, profile?._id]);

  const { incomingOrders, dismissOrder, audioUnlocked, enableAudio } =
    useSocketOrders(
      () => {},
      (isVerified) => {
        setProfile((prev) => (prev ? { ...prev, isVerified } : prev));
      },
    );

  useEffect(() => {
    if (
      incomingOrders.length > 0 &&
      window.location.pathname !== "/rider/dashboard"
    ) {
      toast("🛎️ New order available! Go to Dashboard to accept it.", {
        duration: 5000,
        icon: "🛵",
      });
    }
  }, [incomingOrders]);

  if (user?.role !== "rider") {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700 text-xl font-bold">
        Not authorized
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;

  if (!profile) return <RegistrationForm fetchProfile={fetchProfile} />;

  const mainPadding = sidebarCollapsed ? "lg:pl-16" : "lg:pl-60";

  return (
    <div className="min-h-screen bg-background">
      <RiderSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />
      <RiderTopBar
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)}
      />
      <MobileDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={`${mainPadding} pb-20 lg:pb-8 transition-all duration-300`}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 lg:py-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <Outlet
              context={{
                incomingOrders,
                dismissOrder,
                audioUnlocked,
                enableAudio,
              }}
            />
          </Suspense>
        </div>
        <Footer />
      </main>

      <RiderBottomNav />
    </div>
  );
};

RiderSidebar.displayName = "RiderSidebar";
RiderTopBar.displayName = "RiderTopBar";
MobileDrawer.displayName = "MobileDrawer";
RiderBottomNav.displayName = "RiderBottomNav";

export default RiderLayout;
