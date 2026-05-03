import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { DeliveryHistoryItem, SortField, SortDir } from "../../types/rider.types";

interface Props {
  items: DeliveryHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
  sort: SortField;
  dir: SortDir;
  onSort: (field: SortField) => void;
  onPage: (p: number) => void;
}

const STATUS_STYLE: Record<string, string> = {
  delivered: "bg-[#1D9E75]/15 text-[#1D9E75] border-[#1D9E75]/30",
  cancelled: "bg-[#E24B4A]/15 text-[#E24B4A] border-[#E24B4A]/30",
  pending: "bg-[#EF9F27]/15 text-[#EF9F27] border-[#EF9F27]/30",
};

const SortIcon = ({ field, sort, dir }: { field: SortField; sort: SortField; dir: SortDir }) => {
  if (sort !== field) return <ChevronUp size={12} className="text-[#555552]" />;
  return dir === "asc" ? (
    <ChevronUp size={12} className="text-[#1D9E75]" />
  ) : (
    <ChevronDown size={12} className="text-[#1D9E75]" />
  );
};

const RecentDeliveriesTable = ({
  items,
  total,
  page,
  totalPages,
  sort,
  dir,
  onSort,
  onPage,
}: Props) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const cols: { label: string; field?: SortField }[] = [
    { label: "Order ID" },
    { label: "Restaurant" },
    { label: "Customer" },
    { label: "Distance", field: "distance" },
    { label: "Earnings", field: "riderAmount" },
    { label: "Status" },
    { label: "Time", field: "createdAt" },
  ];

  if (!items.length) {
    return (
      <div className="bg-[#2C2C2A] border border-[#3a3a37] rounded-2xl p-10 flex flex-col items-center gap-3">
        <span className="text-5xl">🛵</span>
        <p className="text-[#888884] text-sm">No deliveries yet. Go online to start earning!</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2C2C2A] border border-[#3a3a37] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#3a3a37]">
              {cols.map((col) => (
                <th
                  key={col.label}
                  onClick={() => col.field && onSort(col.field)}
                  className={`px-4 py-3 text-left text-[#888884] font-mono text-xs uppercase tracking-wider whitespace-nowrap ${
                    col.field ? "cursor-pointer hover:text-white select-none" : ""
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.field && <SortIcon field={col.field} sort={sort} dir={dir} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <>
                <tr
                  key={item._id}
                  onClick={() => setExpanded(expanded === item._id ? null : item._id)}
                  className="border-b border-[#3a3a37] hover:bg-[#333330] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-[#888884] text-xs whitespace-nowrap">
                    #{item._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-white whitespace-nowrap max-w-[140px] truncate">
                    {item.restaurantName}
                  </td>
                  <td className="px-4 py-3 text-[#aaa] whitespace-nowrap max-w-[120px] truncate">
                    {item.customerName}
                  </td>
                  <td className="px-4 py-3 text-[#888884] font-mono whitespace-nowrap">
                    {item.distance?.toFixed(1)} km
                  </td>
                  <td className="px-4 py-3 text-[#EF9F27] font-mono font-semibold whitespace-nowrap">
                    ₹{item.riderAmount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
                        STATUS_STYLE[item.status] ?? STATUS_STYLE.pending
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#888884] font-mono text-xs whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
                {expanded === item._id && (
                  <tr key={`${item._id}-exp`} className="bg-[#1e1e1c]">
                    <td colSpan={7} className="px-6 py-3">
                      <div className="flex flex-wrap gap-3 text-xs text-[#888884]">
                        {item.items.map((it, i) => (
                          <span key={i} className="bg-[#2C2C2A] px-2.5 py-1 rounded-lg">
                            {it.quantity}× {it.name} — ₹{it.price * it.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#3a3a37]">
        <span className="text-[#888884] text-xs font-mono">
          {total} total · page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg hover:bg-[#3a3a37] disabled:opacity-30 text-[#888884] transition"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
            return (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-mono transition ${
                  p === page
                    ? "bg-[#1D9E75] text-white"
                    : "text-[#888884] hover:bg-[#3a3a37]"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg hover:bg-[#3a3a37] disabled:opacity-30 text-[#888884] transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentDeliveriesTable;
