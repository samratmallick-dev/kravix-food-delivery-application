import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessor?: keyof T;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  page: number;
  pages: number;
  total: number;
  onPageChange: (p: number) => void;
  keyExtractor: (row: T) => string;
  skeletonRows?: number;
}

function DataTable<T>({
  columns, data, loading, page, pages, total, onPageChange, keyExtractor, skeletonRows = 8,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (col: ColumnDef<T>) => {
    if (!col.sortable || !col.accessor) return;
    if (sortKey === col.accessor) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.accessor);
      setSortDir("asc");
    }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (av === bv) return 0;
        const cmp = av! < bv! ? -1 : 1;
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid">
          <thead>
            <tr className="border-b border-gray-100 bg-[#F8F8F6]">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide select-none ${col.sortable ? "cursor-pointer hover:text-gray-600" : ""} ${col.className ?? ""}`}
                  aria-sort={sortKey === col.accessor ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  onClick={() => handleSort(col)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && col.accessor && (
                      sortKey === col.accessor
                        ? sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        : <ChevronsUpDown size={12} className="opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + (j * 17) % 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <span className="text-3xl">📭</span>
                    <p className="text-sm font-medium">No records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={keyExtractor(row)} className="hover:bg-[#F8F8F6] transition-colors">
                  {columns.map((col, j) => (
                    <td key={j} className={`px-4 py-3 ${col.className ?? ""}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-[#F8F8F6]">
          <p className="text-[11px] text-gray-400 font-mono">
            {total} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-mono px-2 text-gray-500">{page} / {pages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
