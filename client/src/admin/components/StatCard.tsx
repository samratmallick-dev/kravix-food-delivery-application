import type { LucideIcon } from "lucide-react";

interface StatCardProps {
      icon: LucideIcon;
      label: string;
      value: number | string;
      sub?: string;
      color?: string;
}

const StatCard = ({ icon: Icon, label, value, sub, color = "text-primary" }: StatCardProps) => (
      <div className="bg-white rounded-xl shadow-sm border border-border p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg bg-gray-50 shrink-0 ${color}`}>
                        <Icon size={16} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide leading-tight">{label}</p>
            </div>
            <p className="text-xl font-bold text-gray-800 leading-tight">{value}</p>
            {sub && <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>}
      </div>
);

export default StatCard;
