import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type {
  RiderProfile,
  EarningsSummary,
  EarningsPeriod,
  ActiveDelivery,
  IncomingOrder,
  DeliveryHistoryPage,
  SortField,
  SortDir,
} from "../../types/rider.types";
import { riderBaseUrl } from "../../components/common/constant";

const token = () => localStorage.getItem("token");
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

export const useRiderProfile = () =>
  useQuery<RiderProfile>({
    queryKey: ["rider", "profile"],
    queryFn: async () => {
      const { data } = await axios.get(`${riderBaseUrl}/me`, { headers: authHeaders() });
      return data.data;
    },
    staleTime: 30_000,
  });

export const useRiderEarnings = (period: EarningsPeriod) =>
  useQuery<EarningsSummary>({
    queryKey: ["rider", "earnings", period],
    queryFn: async () => {
      const { data } = await axios.get(`${riderBaseUrl}/earnings?period=${period}`, {
        headers: authHeaders(),
      });
      return data.data;
    },
    staleTime: 60_000,
  });

export const useActiveDelivery = () =>
  useQuery<ActiveDelivery | null>({
    queryKey: ["rider", "active-delivery"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${riderBaseUrl}/orders/current`, {
          headers: authHeaders(),
        });
        return data.data ?? null;
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        throw e;
      }
    },
    refetchInterval: 5_000,
  });

export const useIncomingOrder = (enabled: boolean) =>
  useQuery<IncomingOrder | null>({
    queryKey: ["rider", "incoming-order"],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`${riderBaseUrl}/incoming-order`, {
          headers: authHeaders(),
        });
        return data.data ?? null;
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        throw e;
      }
    },
    refetchInterval: enabled ? 3_000 : false,
    enabled,
  });

export const useDeliveryHistory = (page: number, sort: SortField, dir: SortDir) =>
  useQuery<DeliveryHistoryPage>({
    queryKey: ["rider", "deliveries", page, sort, dir],
    queryFn: async () => {
      const { data } = await axios.get(
        `${riderBaseUrl}/orders/delivery-history?page=${page}&sort=${sort}&dir=${dir}`,
        { headers: authHeaders() }
      );
      return data.data;
    },
    placeholderData: (prev) => prev,
  });

export const useRiderMutations = () => {
  const qc = useQueryClient();

  const patchStatus = useMutation({
    mutationFn: async (payload: { isAvailable: boolean; latitude: number; longitude: number }) =>
      axios.patch(`${riderBaseUrl}/me/availability`, payload, { headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rider", "profile"] }),
  });

  const patchDeliveryStep = useMutation({
    mutationFn: async (payload: { orderId: string; latitude?: number; longitude?: number }) =>
      axios.patch(`${riderBaseUrl}/orders/status`, payload, { headers: authHeaders() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rider", "active-delivery"] });
      qc.invalidateQueries({ queryKey: ["rider", "deliveries"] });
      qc.invalidateQueries({ queryKey: ["rider", "earnings"] });
    },
  });

  const acceptOrder = useMutation({
    mutationFn: async (orderId: string) =>
      axios.post(`${riderBaseUrl}/orders/${orderId}/accept`, {}, { headers: authHeaders() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rider", "incoming-order"] });
      qc.invalidateQueries({ queryKey: ["rider", "active-delivery"] });
      qc.invalidateQueries({ queryKey: ["rider", "profile"] });
    },
  });

  const declineOrder = useMutation({
    mutationFn: async (orderId: string) =>
      axios.post(`${riderBaseUrl}/orders/${orderId}/decline`, {}, { headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rider", "incoming-order"] }),
  });

  return { patchStatus, patchDeliveryStep, acceptOrder, declineOrder };
};
