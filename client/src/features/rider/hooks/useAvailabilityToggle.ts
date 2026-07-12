import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import type { IRider } from "@/types";
import { toggleRiderAvailability } from "@/services/api/rider.services";

export const useAvailabilityToggle = (
  profile: IRider | null,
  setProfile: React.Dispatch<React.SetStateAction<IRider | null>>,
  location: { latitude: number; longitude: number } | null
) => {
  const [toggling, setToggling] = useState(false);

  const toggle = useCallback(async () => {
    if (!location) {
      toast.error("Location data is not available. Please enable location access.");
      return;
    }
    setToggling(true);
    try {
      const res = await toggleRiderAvailability({
        isAvailable: !profile?.isAvailable,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      toast.success(res.message || "Availability updated!");
      setProfile((prev) => prev ? { ...prev, isAvailable: !prev.isAvailable } : prev);
    } catch (err: any) {
      toast.error(err.message || "Failed to update availability.");
    } finally {
      setToggling(false);
    }
  }, [location, profile?.isAvailable, setProfile]);

  return { toggling, toggle };
};
