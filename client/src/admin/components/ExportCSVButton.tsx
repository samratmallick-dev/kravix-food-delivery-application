import { Download } from "lucide-react";

interface ExportCSVButtonProps<T> {
  data: T[];
  filename: string;
  columns: { header: string; accessor: (row: T) => string | number }[];
  disabled?: boolean;
}

function ExportCSVButton<T>({ data, filename, columns, disabled }: ExportCSVButtonProps<T>) {
  const handleExport = () => {
    if (!data.length) return;
    const header = columns.map((c) => `"${c.header}"`).join(",");
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = String(c.accessor(row)).replace(/"/g, '""');
        return `"${val}"`;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || !data.length}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#185FA5] hover:text-[#185FA5] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
    >
      <Download size={13} />
      Export CSV
    </button>
  );
}

export default ExportCSVButton;
