import { useCallback, useState } from "react";
import type { IRiderEarnings } from "@/types";
import { fetchEarnings } from "@/services/api/rider.services";

export const useEarnings = () => {
  const [earnings, setEarnings] = useState<IRiderEarnings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEarnings();
      setEarnings(res.data as any);
    } catch {
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { earnings, loading, fetchData };
};
