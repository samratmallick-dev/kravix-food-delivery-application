import { memo, type ReactNode } from "react";

interface EmptyCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

const EmptyCard = memo(({ icon, title, description, action }: EmptyCardProps) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3">
    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
      {icon}
    </div>
    <p className="text-sm font-semibold text-gray-700">{title}</p>
    {description && <p className="text-xs text-gray-400 max-w-xs">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
));

EmptyCard.displayName = "EmptyCard";
export default EmptyCard;
