import { memo, useMemo } from "react";
import { Zap, Gift, Clock } from "lucide-react";
import SectionCard from "../../ui/SectionCard";
import type { IRiderEarnings } from "../../../types/types";

interface IncentivesPanelProps {
  earnings: IRiderEarnings;
}

const IncentivesPanel = memo(({ earnings }: IncentivesPanelProps) => {
  const questProgress = useMemo(() => {
    const target = 10;
    const done = Math.min(earnings.totalDeliveries % target, target);
    return { done, target, pct: Math.round((done / target) * 100) };
  }, [earnings.totalDeliveries]);

  return (
    <SectionCard title="Incentives & Quests">
      <div className="space-y-4">
        {/* Daily quest */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Zap size={14} className="text-amber-500" /> Daily Quest
            </div>
            <span className="text-xs text-gray-500">{questProgress.done}/{questProgress.target} deliveries</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${questProgress.pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">Complete {questProgress.target} deliveries to earn a ₹50 bonus</p>
        </div>

        {/* Peak hour */}
        <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
          <Clock size={16} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Peak Hour Bonus</p>
            <p className="text-xs text-blue-600">Active 12–2 PM & 7–9 PM · +₹10/delivery</p>
          </div>
        </div>

        {/* Milestone */}
        <div className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-3">
          <Gift size={16} className="text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Milestone Reward</p>
            <p className="text-xs text-green-600">{earnings.totalDeliveries} total deliveries · Keep going!</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
});

IncentivesPanel.displayName = "IncentivesPanel";
export default IncentivesPanel;
