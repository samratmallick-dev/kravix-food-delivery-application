import { useCallback, useEffect } from "react";
import { useAppData } from "../../context/AppContext";
import { useSocket } from "../../context/SocketContext";
import { useRiderProfile } from "../../hooks/useRiderProfile";
import { useActiveOrder } from "../../hooks/useActiveOrder";
import { useDeliveryHistory } from "../../hooks/useDeliveryHistory";
import { useEarnings } from "../../hooks/useEarnings";
import { useSocketOrders } from "../../hooks/useSocketOrders";
import { useAvailabilityToggle } from "../../hooks/useAvailabilityToggle";
import { usePermissions } from "../../hooks/usePermissions";
import { acceptOrder } from "../../utils/rider.api";
import toast from "react-hot-toast";
import { VolumeX, MapPin, AlertTriangle, Package } from "lucide-react";
import HeroCard from "../../components/rider/dashboard/HeroCard";
import StatCards from "../../components/rider/dashboard/StatCards";
import AnalyticsPanel from "../../components/rider/dashboard/AnalyticsPanel";
import AvailabilityToggle from "../../components/rider/shared/AvailabilityToggle";
import PermissionCard from "../../components/rider/shared/PermissionCard";
import IncomingOrderCard from "../../components/rider/orders/IncomingOrderCard";
import CurrentOrderCard from "../../components/rider/orders/CurrentOrderCard";
import RiderMap from "../../components/rider/shared/RiderMap";
import EmptyCard from "../../components/ui/EmptyCard";
import { DashboardSkeleton } from "../../components/skeleton/RiderSkeletons";
import { storage } from "../../utils/secureStorage";

const Dashboard = () => {
  const { user, location, locationLoading, setUser, setIsAuth } = useAppData();
  const { socket } = useSocket();
  const { profile, setProfile, loading, fetchProfile } = useRiderProfile();
  const { history, fetchHistory } = useDeliveryHistory();
  const { earnings, fetchData: fetchEarnings } = useEarnings();
  const isBlocked = !!(user?.isBlocked && user.blockedUntil && new Date(user.blockedUntil) > new Date());

  const { currentOrder, currentOrderRef, fetchCurrentOrder, handleStatusUpdate, handleGenerateOtp } = useActiveOrder(
    useCallback(() => {
      setProfile((prev) => prev ? { ...prev, isAvailable: false } : prev);
      fetchHistory();
    }, [setProfile, fetchHistory])
  );

  const onOrderUpdate = useCallback((orderId: string) => {
    if (currentOrderRef.current?._id === orderId || !currentOrderRef.current) fetchCurrentOrder();
  }, [fetchCurrentOrder, currentOrderRef]);

  const onRiderVerified = useCallback((isVerified: boolean) => {
    setProfile((prev) => prev ? { ...prev, isVerified } : prev);
  }, [setProfile]);

  const { incomingOrders, dismissOrder, audioUnlocked, enableAudio } = useSocketOrders(onOrderUpdate, onRiderVerified);
  const { toggling, toggle } = useAvailabilityToggle(profile, setProfile, location);
  const { locationPerm } = usePermissions();

  useEffect(() => {
    if (!user?._id || user.role !== "rider") return;
    fetchProfile();
    fetchCurrentOrder();
    fetchHistory();
    fetchEarnings();
  }, [user?._id, user?.role]);

  useEffect(() => {
    if (socket && user?._id) socket.emit("join:rider", user._id);
  }, [socket, user?._id]);

  const handleLogout = async () => {
    if (profile?.isAvailable) {
      try { await import("../../utils/rider.api").then(m => m.toggleRiderAvailability({ isAvailable: false, latitude: location?.latitude ?? 0, longitude: location?.longitude ?? 0 })); } catch {}
    }
    storage.removeToken();
    toast.success("Logged out successfully");
    setUser(null);
    setIsAuth(false);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 rider-page-enter">
      {/* Blocked banner */}
      {isBlocked && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Account temporarily blocked</p>
            <p className="text-xs text-red-500">Until {new Date(user!.blockedUntil!).toLocaleDateString("en-IN")}</p>
          </div>
        </div>
      )}

      {/* Hero */}
      {user && profile && (
        <HeroCard
          user={user}
          profile={profile}
          hasActiveOrder={!!currentOrder}
          onLogout={handleLogout}
        />
      )}

      {/* Availability toggle */}
      {profile?.isVerified && (
        <AvailabilityToggle
          isAvailable={profile.isAvailable}
          isOnDelivery={!!currentOrder}
          toggling={toggling}
          disabled={isBlocked || !location}
          onToggle={toggle}
        />
      )}

      {/* Location warning */}
      {!locationLoading && !location && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800 font-medium">
            Location not available. Enable location access to go online and receive orders.
          </p>
        </div>
      )}

      {/* Sound notification prompt */}
      {!audioUnlocked && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <VolumeX size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Enable sound notifications</p>
              <p className="text-xs text-amber-600">Get alerted when new orders arrive</p>
            </div>
          </div>
          <button
            onClick={async () => { const ok = await enableAudio(); if (!ok) toast.error("Failed to enable sound."); else toast.success("Sound enabled!"); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition"
          >
            Enable
          </button>
        </div>
      )}

      {/* Permissions */}
      <PermissionCard
        icon={<MapPin size={16} />}
        title="Location Access"
        description={locationPerm === "granted" ? location?.formattedAddress ?? "Active" : "Required to go online"}
        status={locationPerm}
      />

      {/* Incoming orders */}
      {incomingOrders.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700">Incoming Orders</p>
          {incomingOrders.map((orderId) => (
            <IncomingOrderCard
              key={orderId}
              orderId={orderId}
              onExpire={() => dismissOrder(orderId)}
              onAccept={isBlocked ? undefined : async () => {
                const res = await acceptOrder(orderId);
                toast.success(res.message || "Order accepted!");
                dismissOrder(orderId);
                setProfile((prev) => prev ? { ...prev, isAvailable: false } : prev);
                await fetchCurrentOrder();
              }}
            />
          ))}
        </div>
      )}

      {/* Current order */}
      {currentOrder && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-gray-700">Active Delivery</p>
          <CurrentOrderCard
            order={currentOrder}
            onStatusUpdate={(otp, cod) => handleStatusUpdate(location, otp, cod)}
            onGenerateOtp={handleGenerateOtp}
          />
          <RiderMap order={currentOrder} />
        </div>
      )}

      {/* Stats */}
      <StatCards earnings={earnings} history={history} />

      {/* Analytics */}
      <AnalyticsPanel history={history} earnings={earnings} />

      {/* Empty state */}
      {!currentOrder && profile?.isVerified && profile.isAvailable && incomingOrders.length === 0 && (
        <EmptyCard
          icon={<Package size={24} />}
          title="Waiting for orders"
          description="You're online. Orders will appear here when available."
        />
      )}
    </div>
  );
};

export default Dashboard;
