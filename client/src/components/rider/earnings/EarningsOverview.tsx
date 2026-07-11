import { memo } from "react";
import { IndianRupee, Package, Star, TrendingUp } from "lucide-react";
import type { IRiderEarnings } from "../../../types/types";
import MetricCard from "../../ui/MetricCard";

interface EarningsOverviewProps {
  earnings: IRiderEarnings;
}

const EarningsOverview = memo(({ earnings }: EarningsOverviewProps) => (
  <div className="grid grid-cols-2 gap-3">
    <MetricCard icon={<IndianRupee size={18} />} label="Today"      value={`₹${earnings.todayEarnings}`} color="green" />
    <MetricCard icon={<TrendingUp size={18} />}  label="This Week"  value={`₹${earnings.weekEarnings}`}  color="blue" />
    <MetricCard icon={<IndianRupee size={18} />} label="Total Earned" value={`₹${earnings.totalEarnings}`} color="purple" />
    <MetricCard icon={<Package size={18} />}     label="Deliveries" value={earnings.totalDeliveries}      color="orange" />
    {earnings.rating !== null && (
      <MetricCard icon={<Star size={18} />} label="Rating" value={`${earnings.rating.toFixed(1)}/5`} color="orange" className="col-span-2" />
    )}
  </div>
));

EarningsOverview.displayName = "EarningsOverview";
export default EarningsOverview;
