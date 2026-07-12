import { useState } from "react";
import { useAppData } from "@/context/AppContext";
import { usePermissions } from "@/features/rider/hooks/usePermissions";
import SectionCard from "@/components/ui/SectionCard";
import PermissionCard from "@/features/rider/components/shared/PermissionCard";
import { storage } from "@/utils";
import toast from "react-hot-toast";
import { MapPin, Volume2, LogOut, Info } from "lucide-react";

const Settings = () => {
  const { setUser, setIsAuth } = useAppData();
  const { locationPerm } = usePermissions();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = () => {
    storage.removeToken();
    toast.success("Logged out successfully");
    setUser(null);
    setIsAuth(false);
  };

  return (
    <div className="space-y-4 rider-page-enter">
      <SectionCard title="Permissions">
        <PermissionCard
          icon={<MapPin size={16} />}
          title="Location Access"
          description="Required to go online and receive orders"
          status={locationPerm}
        />
      </SectionCard>

      <SectionCard title="Notification Preferences">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 size={16} className="text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Order Alert Sound</p>
              <p className="text-xs text-gray-400">Play sound when new orders arrive</p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Toggle order alert sound"
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${soundEnabled ? "bg-primary" : "bg-gray-200"}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${soundEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </SectionCard>

      <SectionCard title="About">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Info size={15} className="text-gray-400 shrink-0" />
          <span>Kravix Rider App · v1.0.0</span>
        </div>
      </SectionCard>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition active:scale-95"
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
};

export default Settings;
