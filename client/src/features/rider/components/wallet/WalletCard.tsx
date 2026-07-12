import { memo } from "react";
import { IndianRupee, Wallet } from "lucide-react";
import type { IRiderEarnings } from "@/types";

interface WalletCardProps {
  earnings: IRiderEarnings;
}

const WalletCard = memo(({ earnings }: WalletCardProps) => (
  <div className="rounded-2xl overflow-hidden" style={{ background: "var(--gradient-rider)" }}>
    <div className="px-5 py-6 space-y-4">
      <div className="flex items-center gap-2 text-white/80">
        <Wallet size={16} />
        <span className="text-sm font-semibold">Total Earnings Balance</span>
      </div>
      <div className="flex items-end gap-1">
        <IndianRupee size={24} className="text-white mb-1" />
        <span className="text-4xl font-bold text-white count-up">{earnings.totalEarnings.toLocaleString("en-IN")}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/20">
        <div>
          <p className="text-white/60 text-xs">Today</p>
          <p className="text-white font-bold">₹{earnings.todayEarnings}</p>
        </div>
        <div>
          <p className="text-white/60 text-xs">This Week</p>
          <p className="text-white font-bold">₹{earnings.weekEarnings}</p>
        </div>
      </div>
    </div>
  </div>
));

WalletCard.displayName = "WalletCard";
export default WalletCard;
