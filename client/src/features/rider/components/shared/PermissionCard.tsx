  import { memo } from "react";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface PermissionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "granted" | "denied" | "prompt" | "unsupported";
  onAction?: () => void;
  actionLabel?: string;
}

const statusIcon = {
  granted:     <CheckCircle2 size={16} className="text-green-500" />,
  denied:      <XCircle size={16} className="text-red-500" />,
  prompt:      <AlertCircle size={16} className="text-amber-500" />,
  unsupported: <XCircle size={16} className="text-gray-400" />,
};

const PermissionCard = memo(({ icon, title, description, status, onAction, actionLabel }: PermissionCardProps) => (
  <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
    <div className="text-gray-500 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {statusIcon[status]}
      </div>
      <p className="text-xs text-gray-500 truncate">{description}</p>
    </div>
    {onAction && status !== "granted" && (
      <button
        onClick={onAction}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-red-700 transition shrink-0"
      >
        {actionLabel || "Enable"}
      </button>
    )}
  </div>
));

PermissionCard.displayName = "PermissionCard";
export default PermissionCard;
