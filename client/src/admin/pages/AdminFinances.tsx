import { useState } from "react";
import { DollarSign, TrendingUp, Clock, IndianRupee } from "lucide-react";
import { useAdminFinances } from "../hooks/useAdminQueries";
import DataTable, { type ColumnDef } from "../components/DataTable";
import StatusChip from "../components/StatusChip";
import ExportCSVButton from "../components/ExportCSVButton";
import MetricCard from "../components/MetricCard";
import type { FinanceRow } from "../types/admin.types";

const getDefaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
};

const AdminFinances = () => {
  const [range, setRange] = useState(getDefaultRange);
  const { data, isLoading } = useAdminFinances(range.from, range.to);

  const rows = data?.rows ?? [];

  const columns: ColumnDef<FinanceRow>[] = [
    {
      header: "Entity",
      accessor: "entityName",
      sortable: true,
      render: (r) => (
        <div>
          <p className="text-xs font-semibold text-gray-700">{r.entityName}</p>
          <span className={`text-[10px] font-medium ${r.entityType === "restaurant" ? "text-[#185FA5]" : "text-[#EF9F27]"}`}>
            {r.entityType}
          </span>
        </div>
      ),
    },
    {
      header: "Orders",
      accessor: "totalOrders",
      sortable: true,
      render: (r) => <span className="font-mono text-xs text-gray-700">{r.totalOrders}</span>,
    },
    {
      header: "Gross Revenue",
      accessor: "grossRevenue",
      sortable: true,
      render: (r) => <span className="font-mono text-xs font-semibold text-gray-700">₹{r.grossRevenue.toLocaleString("en-IN")}</span>,
    },
    {
      header: "Platform Commission",
      accessor: "platformCommission",
      sortable: true,
      render: (r) => <span className="font-mono text-xs text-[#185FA5]">₹{r.platformCommission.toLocaleString("en-IN")}</span>,
    },
    {
      header: "Net Payout",
      accessor: "netPayout",
      sortable: true,
      render: (r) => <span className="font-mono text-xs font-bold text-gray-800">₹{r.netPayout.toLocaleString("en-IN")}</span>,
    },
    {
      header: "Payout Status",
      render: (r) => <StatusChip status={r.payoutStatus} label={r.payoutStatus} />,
    },
  ];

  return (
    <div className="p-5 space-y-5 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Finances</h1>
          <p className="text-xs text-gray-400 mt-0.5">Earnings breakdown & payout status</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-[#185FA5]"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <span className="text-[11px] text-gray-400">From</span>
            <input type="date" value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="text-xs text-gray-600 outline-none cursor-pointer bg-transparent" />
          </div>
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2 bg-white focus-within:border-[#185FA5]"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <span className="text-[11px] text-gray-400">To</span>
            <input type="date" value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="text-xs text-gray-600 outline-none cursor-pointer bg-transparent" />
          </div>
          <ExportCSVButton
            data={rows}
            filename="finances"
            columns={[
              { header: "Entity", accessor: (r) => r.entityName },
              { header: "Type", accessor: (r) => r.entityType },
              { header: "Orders", accessor: (r) => r.totalOrders },
              { header: "Gross Revenue", accessor: (r) => r.grossRevenue },
              { header: "Platform Commission", accessor: (r) => r.platformCommission },
              { header: "Net Payout", accessor: (r) => r.netPayout },
              { header: "Payout Status", accessor: (r) => r.payoutStatus },
            ]}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          icon={IndianRupee}
          label="Total Payouts"
          value={isLoading ? "—" : `₹${(data?.totalPayouts ?? 0).toLocaleString("en-IN")}`}
          sub="net payouts to entities"
          accentColor="#1D9E75"
          loading={isLoading}
        />
        <MetricCard
          icon={TrendingUp}
          label="Platform Commission"
          value={isLoading ? "—" : `₹${(data?.platformCommission ?? 0).toLocaleString("en-IN")}`}
          sub="platform earnings"
          accentColor="#185FA5"
          loading={isLoading}
        />
        <MetricCard
          icon={Clock}
          label="Pending Settlements"
          value={isLoading ? "—" : `₹${(data?.pendingSettlements ?? 0).toLocaleString("en-IN")}`}
          sub="awaiting payout"
          accentColor="#EF9F27"
          loading={isLoading}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        page={1}
        pages={1}
        total={rows.length}
        onPageChange={() => {}}
        keyExtractor={(r) => r.entityId}
      />

      {!isLoading && rows.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <DollarSign size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">No finance data for selected range.</p>
          <p className="text-xs text-gray-300 mt-1">The /finances endpoint needs to be implemented on the backend.</p>
        </div>
      )}
    </div>
  );
};

export default AdminFinances;
