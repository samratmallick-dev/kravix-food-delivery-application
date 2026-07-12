import { memo } from "react";

type Status = "online" | "offline" | "busy" | "break";

const statusConfig: Record<Status, { label: string; bg: string; dot: string; text: string }> = {
  online:  { label: "Online",  bg: "bg-green-100",  dot: "bg-green-500",  text: "text-green-700" },
  offline: { label: "Offline", bg: "bg-gray-100",   dot: "bg-gray-400",   text: "text-gray-600" },
  busy:    { label: "On Delivery", bg: "bg-blue-100", dot: "bg-blue-500", text: "text-blue-700" },
  break:   { label: "On Break", bg: "bg-amber-100", dot: "bg-amber-500",  text: "text-amber-700" },
};

interface StatusBadgeProps {
  status: Status;
  pulse?: boolean;
  size?: "sm" | "md";
}

const StatusBadge = memo(({ status, pulse = true, size = "md" }: StatusBadgeProps) => {
  const c = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold ${c.bg} ${c.text} ${size === "sm" ? "text-xs" : "text-xs"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${pulse && status !== "offline" ? "animate-pulse" : ""}`} />
      {c.label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";
export default StatusBadge;
