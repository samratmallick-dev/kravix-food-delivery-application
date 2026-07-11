import { memo, type ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const DashboardCard = memo(({ children, className = "", onClick }: DashboardCardProps) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-md)] transition-shadow hover:shadow-[var(--shadow-lg)] ${onClick ? "cursor-pointer" : ""} ${className}`}
  >
    {children}
  </div>
));

DashboardCard.displayName = "DashboardCard";
export default DashboardCard;
