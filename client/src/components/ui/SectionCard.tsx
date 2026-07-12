import { memo, type ReactNode } from "react";

interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

const SectionCard = memo(({ title, action, children, className = "" }: SectionCardProps) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-(--shadow-sm) ${className}`}>
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      {action && <div className="text-xs">{action}</div>}
    </div>
    <div className="p-5">{children}</div>
  </div>
));

SectionCard.displayName = "SectionCard";
export default SectionCard;
