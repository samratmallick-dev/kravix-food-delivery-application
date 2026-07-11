import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import type { IRider } from "../types/types";
import { fetchMyRiderProfile, updateRiderProfile } from "../utils/rider.api";

export const useRiderProfile = () => {
  const [profile, setProfile] = useState<IRider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyRiderProfile();
      setProfile(res.data || null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (payload: { phoneNumber?: string; aadhaarNumber?: string; drivingLicesce?: string; panNumber?: string; image?: File }) => {
    setSaving(true);
    try {
      const res = await updateRiderProfile(payload);
      setProfile(res.data);
      toast.success(res.message || "Profile updated!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, setProfile, loading, saving, fetchProfile, saveProfile };
};
