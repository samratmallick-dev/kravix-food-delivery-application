import { memo, useCallback, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

type FilterTab = "all" | "assigned" | "picked_up" | "delivered" | "cancelled";
type SortOption = "newest" | "oldest" | "highest";

interface OrderFiltersProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "assigned",  label: "Assigned" },
  { key: "picked_up", label: "Picked" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const OrderFilters = memo(({ activeTab, onTabChange, search, onSearchChange, sort, onSortChange }: OrderFiltersProps) => {
  const [showSort, setShowSort] = useState(false);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  return (
    <div className="space-y-3 sticky top-0 z-10 bg-background pb-2 pt-1">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors shadow-(--shadow-sm)">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Search by restaurant or order ID..."
          className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
          aria-label="Search orders"
        />
        <button
          onClick={() => setShowSort((v) => !v)}
          aria-label="Sort options"
          className={`p-1 rounded-lg transition ${showSort ? "text-primary bg-red-50" : "text-gray-400 hover:text-gray-600"}`}
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>

      {showSort && (
        <div className="flex gap-2 bg-white rounded-xl p-2 border border-gray-100 shadow-(--shadow-sm)">
          {(["newest", "oldest", "highest"] as SortOption[]).map((s) => (
            <button
              key={s}
              onClick={() => { onSortChange(s); setShowSort(false); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${sort === s ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {s === "newest" ? "Newest" : s === "oldest" ? "Oldest" : "Highest Earning"}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition ${activeTab === key ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
});

OrderFilters.displayName = "OrderFilters";
export default OrderFilters;
