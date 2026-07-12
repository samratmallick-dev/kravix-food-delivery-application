import { useCallback, useState } from "react";
import type { IOrder } from "@/types";
import { fetchDeliveryHistory as apiFetchDeliveryHistory } from "@/services/api/rider.services";

export const useDeliveryHistory = () => {
  const [history, setHistory] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetchDeliveryHistory();
      setHistory(res.data?.orders || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { history, loading, fetchHistory };
};
