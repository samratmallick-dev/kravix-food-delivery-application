import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
      header: string;
      render: (row: T) => React.ReactNode;
      className?: string;
}

interface AdminTableProps<T> {
      columns: Column<T>[];
      data: T[];
      loading: boolean;
      page: number;
      pages: number;
      total: number;
      onPageChange: (p: number) => void;
      keyExtractor: (row: T) => string;
}

function AdminTable<T>({ columns, data, loading, page, pages, total, onPageChange, keyExtractor }: AdminTableProps<T>) {
      return (
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                              <thead>
                                    <tr className="bg-gray-50 border-b border-border">
                                          {columns.map((col, i) => (
                                                <th key={i} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${col.className ?? ""}`}>
                                                      {col.header}
                                                </th>
                                          ))}
                                    </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                    {loading ? (
                                          Array.from({ length: 8 }).map((_, i) => (
                                                <tr key={i}>
                                                      {columns.map((_, j) => (
                                                            <td key={j} className="px-4 py-3">
                                                                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                                            </td>
                                                      ))}
                                                </tr>
                                          ))
                                    ) : data.length === 0 ? (
                                          <tr>
                                                <td colSpan={columns.length} className="px-4 py-16 text-center text-gray-400">
                                                      <div className="flex flex-col items-center gap-2">
                                                            <span className="text-4xl">📭</span>
                                                            <p className="text-sm font-medium">No records found</p>
                                                      </div>
                                                </td>
                                          </tr>
                                    ) : (
                                          data.map((row) => (
                                                <tr key={keyExtractor(row)} className="hover:bg-gray-50 transition-colors">
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
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-gray-50">
                              <p className="text-xs text-gray-500">Total: <span className="font-semibold text-gray-700">{total}</span></p>
                              <div className="flex items-center gap-1">
                                    <button
                                          onClick={() => onPageChange(page - 1)}
                                          disabled={page <= 1}
                                          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                    >
                                          <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-xs font-medium px-2 text-gray-600">{page} / {pages}</span>
                                    <button
                                          onClick={() => onPageChange(page + 1)}
                                          disabled={page >= pages}
                                          className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                    >
                                          <ChevronRight size={16} />
                                    </button>
                              </div>
                        </div>
                  )}
            </div>
      );
}

export default AdminTable;
