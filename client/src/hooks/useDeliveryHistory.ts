import { useCallback, useState } from "react";
import type { IOrder } from "../types/types";
import { fetchDeliveryHistory as apiFetchDeliveryHistory } from "../utils/rider.api";

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
