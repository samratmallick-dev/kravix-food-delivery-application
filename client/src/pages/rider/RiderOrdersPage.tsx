import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDeliveryHistory } from "@/features/rider/hooks/useDeliveryHistory";
import type { IOrder } from "@/types";
import OrderCard from "@/features/rider/components/orders/OrderCard";
import OrderFilters from "@/features/rider/components/orders/OrderFilters";
import EmptyCard from "@/components/ui/EmptyCard";
import { OrdersSkeleton } from "@/features/rider/components/skeletons/RiderSkeletons";
import { Package } from "lucide-react";

type FilterTab = "all" | "assigned" | "picked_up" | "delivered" | "cancelled";
type SortOption = "newest" | "oldest" | "highest";

const DEBOUNCE_MS = 300;

const Orders = () => {
  const { history, loading, fetchHistory } = useDeliveryHistory();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(v), DEBOUNCE_MS);
  }, []);

  const filtered = useMemo(() => {
    let list: IOrder[] = history;

    if (activeTab !== "all") {
      const statusMap: Record<FilterTab, string[]> = {
        all:       [],
        assigned:  ["rider_assigned", "ready_for_rider"],
        picked_up: ["picked_up", "out_for_delivery", "reached_delivery_location"],
        delivered: ["delivered"],
        cancelled: ["cancelled"],
      };
      list = list.filter((o) => statusMap[activeTab].includes(o.status));
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((o) =>
        o.restaurantName.toLowerCase().includes(q) ||
        o._id.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return b.riderAmount - a.riderAmount;
    });
  }, [history, activeTab, debouncedSearch, sort]);

  if (loading) return <OrdersSkeleton />;

  return (
    <div className="space-y-3 rider-page-enter">
      <OrderFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={handleSearchChange}
        sort={sort}
        onSortChange={setSort}
      />

      {filtered.length === 0 ? (
        <EmptyCard
          icon={<Package size={24} />}
          title="No orders found"
          description={debouncedSearch ? "Try a different search term" : "No orders in this category yet"}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => <OrderCard key={order._id} order={order} />)}
        </div>
      )}
    </div>
  );
};

export default Orders;
