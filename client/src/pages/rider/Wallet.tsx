import { useEffect } from "react";
import { useEarnings } from "../../hooks/useEarnings";
import { useDeliveryHistory } from "../../hooks/useDeliveryHistory";
import WalletCard from "../../components/rider/wallet/WalletCard";
import TransactionList from "../../components/rider/wallet/TransactionList";
import SectionCard from "../../components/ui/SectionCard";
import { EarningsSkeleton } from "../../components/skeleton/RiderSkeletons";
import { Building2, Smartphone } from "lucide-react";

const Wallet = () => {
  const { earnings, loading, fetchData } = useEarnings();
  const { history, fetchHistory } = useDeliveryHistory();

  useEffect(() => { fetchData(); fetchHistory(); }, [fetchData, fetchHistory]);

  if (loading) return <EarningsSkeleton />;
  if (!earnings) return <p className="text-center text-gray-500 py-12">Failed to load wallet data</p>;

  const codOrders = history.filter((o) => o.status === "delivered" && o.paymentMethod === "cod");
  const codTotal = codOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-4 rider-page-enter">
      <WalletCard earnings={earnings} />

      {/* Settlement info */}
      <SectionCard title="Settlement Summary">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Today's Earnings</span>
            <span className="font-bold text-green-600">₹{earnings.todayEarnings}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">This Week</span>
            <span className="font-bold text-blue-600">₹{earnings.weekEarnings}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
            <span className="text-gray-600">Total Deliveries</span>
            <span className="font-bold text-gray-800">{earnings.totalDeliveries}</span>
          </div>
        </div>
      </SectionCard>

      {/* COD collected */}
      {codOrders.length > 0 && (
        <SectionCard title="Cash Collected (COD)">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total COD collected</span>
            <span className="font-bold text-orange-600">₹{codTotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">From {codOrders.length} COD order{codOrders.length !== 1 ? "s" : ""}</p>
        </SectionCard>
      )}

      {/* Payout methods (UI only) */}
      <SectionCard title="Payout Methods">
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Building2 size={16} className="text-gray-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Bank Transfer</p>
              <p className="text-xs text-gray-400">Add your bank account for direct settlements</p>
            </div>
            <span className="text-xs text-gray-400 ml-auto">Coming soon</span>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Smartphone size={16} className="text-gray-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-800">UPI Transfer</p>
              <p className="text-xs text-gray-400">Link your UPI ID for instant payouts</p>
            </div>
            <span className="text-xs text-gray-400 ml-auto">Coming soon</span>
          </div>
        </div>
      </SectionCard>

      <TransactionList history={history} />
    </div>
  );
};

export default Wallet;
