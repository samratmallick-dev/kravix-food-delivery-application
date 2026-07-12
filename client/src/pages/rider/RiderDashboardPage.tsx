import { useCallback, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useAppData } from "@/context/AppContext";
import { useSocket } from "@/context/SocketContext";
import { useRiderProfile } from "@/features/rider/hooks/useRiderProfile";
import { useActiveOrder } from "@/features/rider/hooks/useActiveOrder";
import { useDeliveryHistory } from "@/features/rider/hooks/useDeliveryHistory";
import { useEarnings } from "@/features/rider/hooks/useEarnings";
import { useAvailabilityToggle } from "@/features/rider/hooks/useAvailabilityToggle";
import { usePermissions } from "@/features/rider/hooks/usePermissions";
import { acceptOrder } from "@/services/api/rider.services";
import toast from "react-hot-toast";
import { VolumeX, MapPin, AlertTriangle, Package } from "lucide-react";
import HeroCard from "@/features/rider/components/dashboard/HeroCard";
import StatCards from "@/features/rider/components/dashboard/StatCards";
import AnalyticsPanel from "@/features/rider/components/dashboard/AnalyticsPanel";
import AvailabilityToggle from "@/features/rider/components/shared/AvailabilityToggle";
import PermissionCard from "@/features/rider/components/shared/PermissionCard";
import IncomingOrderCard from "@/features/rider/components/orders/IncomingOrderCard";
import CurrentOrderCard from "@/features/rider/components/orders/CurrentOrderCard";
import RiderMap from "@/features/rider/components/shared/RiderMap";
import EmptyCard from "@/components/ui/EmptyCard";
import { DashboardSkeleton } from "@/features/rider/components/skeletons/RiderSkeletons";
import { storage } from "@/utils";

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
      fetchProfile();
      fetchEarnings();
      fetchHistory();
    }, [setProfile, fetchProfile, fetchEarnings, fetchHistory])
  );

  useEffect(() => {
    if (!socket) return;
    const onUpdate = ({ orderId }: { orderId: string }) => {
      if (currentOrderRef.current?._id === orderId || !currentOrderRef.current) {
        fetchCurrentOrder();
      }
    };
    socket.on("order:update", onUpdate);
    return () => {
      socket.off("order:update", onUpdate);
    };
  }, [socket, fetchCurrentOrder]);

  const { incomingOrders, dismissOrder, audioUnlocked, enableAudio } = useOutletContext<{
    incomingOrders: string[];
    dismissOrder: (orderId: string) => void;
    audioUnlocked: boolean;
    enableAudio: () => Promise<boolean>;
  }>();

  const { toggling, toggle } = useAvailabilityToggle(profile, setProfile, location);
  const { locationPerm } = usePermissions();

  useEffect(() => {
    if (!user?._id || user.role !== "rider") return;
    fetchProfile();
    fetchCurrentOrder();
    fetchHistory();
    fetchEarnings();
  }, [user?._id, user?.role]);

  const handleLogout = async () => {
    if (profile?.isAvailable) {
      try { await import("@/services/api/rider.services").then(m => m.toggleRiderAvailability({ isAvailable: false, latitude: location?.latitude ?? 0, longitude: location?.longitude ?? 0 })); } catch {}
    }
    storage.removeToken();
    toast.success("Logged out successfully");
    setUser(null);
    setIsAuth(false);
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-4 rider-page-enter">
      {isBlocked && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Account temporarily blocked</p>
            <p className="text-xs text-red-500">Until {new Date(user!.blockedUntil!).toLocaleDateString("en-IN")}</p>
          </div>
        </div>
      )}
      {user && profile && (
        <HeroCard
          user={user}
          profile={profile}
          hasActiveOrder={!!currentOrder}
          onLogout={handleLogout}
        />
      )}

      {profile?.isVerified && (
        <AvailabilityToggle
          isAvailable={profile.isAvailable}
          isOnDelivery={!!currentOrder}
          toggling={toggling}
          disabled={isBlocked || !location}
          onToggle={toggle}
        />
      )}

      {!locationLoading && !location && (
        <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800 font-medium">
            Location not available. Enable location access to go online and receive orders.
          </p>
        </div>
      )}

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

      <PermissionCard
        icon={<MapPin size={16} />}
        title="Location Access"
        description={locationPerm === "granted" ? location?.formattedAddress ?? "Active" : "Required to go online"}
        status={locationPerm}
      />

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

      <StatCards earnings={earnings} history={history} />

      <AnalyticsPanel history={history} earnings={earnings} />

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
