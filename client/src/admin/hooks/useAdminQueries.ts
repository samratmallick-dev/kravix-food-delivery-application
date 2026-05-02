import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminApi } from "./useAdminApi";
import toast from "react-hot-toast";
import type {
  Metrics, AdminOrder, AdminUser, AdminRestaurant, AdminRider,
  AdminMenuItem, FinanceSummary, AnalyticsData,
  OrderFilters, UserFilters, RestaurantFilters,
} from "../types/admin.types";

interface PaginatedOrders { orders: AdminOrder[]; total: number; page: number; pages: number }
interface PaginatedUsers { users: AdminUser[]; total: number; page: number; pages: number }
interface PaginatedRestaurants { restaurants: AdminRestaurant[]; total: number; page: number; pages: number }
interface PaginatedRiders { riders: AdminRider[]; total: number; page: number; pages: number }

// ── Metrics ──────────────────────────────────────────────────────────────────
export const useAdminMetrics = () => {
  const api = useAdminApi();
  return useQuery<Metrics>({
    queryKey: ["admin", "metrics"],
    queryFn: async () => {
      const [dash, orders30] = await Promise.all([
        api.get("/dashboard"),
        api.get("/orders", { params: { limit: 500, paymentStatus: "paid" } }),
      ]);
      const d = dash.data.data;
      // Build revenueByDay from orders
      const byDay: Record<string, number> = {};
      const now = Date.now();
      for (const o of orders30.data.data.orders as AdminOrder[]) {
        const age = (now - new Date(o.createdAt).getTime()) / 86400000;
        if (age > 30) continue;
        const key = o.createdAt.slice(0, 10);
        byDay[key] = (byDay[key] ?? 0) + o.totalAmount;
      }
      const revenueByDay = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({ date, revenue }));

      return {
        ordersToday: d.today?.orders ?? 0,
        revenueToday: d.today?.revenue ?? 0,
        activeRiders: d.riders?.verified ?? 0,
        activeRestaurants: d.restaurants?.verified ?? 0,
        ordersByStatus: d.orders ?? {},
        revenueByDay,
        ...d,
      };
    },
    refetchInterval: 10_000,
    staleTime: 8_000,
  });
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const useAdminOrders = (filters: OrderFilters) => {
  const api = useAdminApi();
  return useQuery<PaginatedOrders>({
    queryKey: ["admin", "orders", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: filters.page, limit: 20 };
      if (filters.status) params["status"] = filters.status;
      if (filters.paymentStatus) params["paymentStatus"] = filters.paymentStatus;
      if (filters.from) params["from"] = filters.from;
      if (filters.to) params["to"] = filters.to;
      const { data } = await api.get("/orders", { params });
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
};

// ── Users ────────────────────────────────────────────────────────────────────
export const useAdminUsers = (filters: UserFilters) => {
  const api = useAdminApi();
  return useQuery<PaginatedUsers>({
    queryKey: ["admin", "users", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: filters.page, limit: 20 };
      if (filters.role && filters.role !== "all") params["role"] = filters.role;
      if (filters.search) params["search"] = filters.search;
      const { data } = await api.get("/users", { params });
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
};

// ── Restaurants ───────────────────────────────────────────────────────────────
export const useAdminRestaurants = (filters: RestaurantFilters) => {
  const api = useAdminApi();
  return useQuery<PaginatedRestaurants>({
    queryKey: ["admin", "restaurants", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: filters.page, limit: 20 };
      if (filters.isVerified && filters.isVerified !== "all") params["isVerified"] = filters.isVerified;
      const { data } = await api.get("/restaurants", { params });
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
};

// ── Riders ────────────────────────────────────────────────────────────────────
export const useAdminRiders = (filters: { isVerified?: string; isAvailable?: string; page: number }) => {
  const api = useAdminApi();
  return useQuery<PaginatedRiders>({
    queryKey: ["admin", "riders", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = { page: filters.page, limit: 20 };
      if (filters.isVerified && filters.isVerified !== "all") params["isVerified"] = filters.isVerified;
      if (filters.isAvailable && filters.isAvailable !== "all") params["isAvailable"] = filters.isAvailable;
      const { data } = await api.get("/riders", { params });
      return data.data;
    },
    placeholderData: (prev) => prev,
  });
};

// ── Restaurant detail ─────────────────────────────────────────────────────────
export const useAdminRestaurantDetail = (id: string | null) => {
  const api = useAdminApi();
  return useQuery<{ restaurant: AdminRestaurant; menuItems: AdminMenuItem[] }>({
    queryKey: ["admin", "restaurant", id],
    queryFn: async () => {
      const { data } = await api.get(`/restaurants/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

// ── Finances ──────────────────────────────────────────────────────────────────
export const useAdminFinances = (from: string, to: string) => {
  const api = useAdminApi();
  return useQuery<FinanceSummary>({
    queryKey: ["admin", "finances", from, to],
    queryFn: async () => {
      const { data } = await api.get("/finances", { params: { from, to } });
      return data.data;
    },
    enabled: !!from && !!to,
  });
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const useAdminAnalytics = (range: "7d" | "30d" | "90d") => {
  const api = useAdminApi();
  return useQuery<AnalyticsData>({
    queryKey: ["admin", "analytics", range],
    queryFn: async () => {
      const { data } = await api.get("/analytics", { params: { range } });
      return data.data;
    },
    staleTime: 60_000,
  });
};

// ── Mutations ─────────────────────────────────────────────────────────────────
export const useCancelOrder = () => {
  const api = useAdminApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.patch(`/orders/${orderId}/cancel`),
    onSuccess: () => { toast.success("Order cancelled"); qc.invalidateQueries({ queryKey: ["admin", "orders"] }); },
    onError: () => toast.error("Failed to cancel order"),
  });
};

export const useBlockUser = () => {
  const api = useAdminApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}/block`),
    onSuccess: () => { toast.success("User block status updated"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: () => toast.error("Failed to update block status"),
  });
};

export const useVerifyRestaurant = () => {
  const api = useAdminApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      api.patch(`/restaurants/${id}/verify`, { isVerified }),
    onSuccess: () => { toast.success("Restaurant verification updated"); qc.invalidateQueries({ queryKey: ["admin", "restaurants"] }); },
    onError: () => toast.error("Failed to update verification"),
  });
};

export const useVerifyRider = () => {
  const api = useAdminApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      api.patch(`/riders/${id}/verify`, { isVerified }),
    onSuccess: () => { toast.success("Rider verification updated"); qc.invalidateQueries({ queryKey: ["admin", "riders"] }); },
    onError: () => toast.error("Failed to update verification"),
  });
};

export const useDeleteRestaurant = () => {
  const api = useAdminApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/restaurants/${id}`),
    onSuccess: () => { toast.success("Restaurant deleted"); qc.invalidateQueries({ queryKey: ["admin", "restaurants"] }); },
    onError: () => toast.error("Failed to delete restaurant"),
  });
};

export const useDeleteRider = () => {
  const api = useAdminApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/riders/${id}`),
    onSuccess: () => { toast.success("Rider deleted"); qc.invalidateQueries({ queryKey: ["admin", "riders"] }); },
    onError: () => toast.error("Failed to delete rider"),
  });
};

export const useUpdateUser = () => {
  const api = useAdminApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) =>
      api.patch(`/users/${id}`, values),
    onSuccess: () => { toast.success("User updated"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: () => toast.error("Failed to update user"),
  });
};

export const useUpdateRestaurant = () => {
  const api = useAdminApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) =>
      api.patch(`/restaurants/${id}`, values),
    onSuccess: () => { toast.success("Restaurant updated"); qc.invalidateQueries({ queryKey: ["admin", "restaurants"] }); },
    onError: () => toast.error("Failed to update restaurant"),
  });
};
