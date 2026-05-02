type StatusVariant = "success" | "danger" | "warning" | "info" | "neutral";

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-[#1D9E75]/10 text-[#1D9E75]",
  danger:  "bg-[#E24B4A]/10 text-[#E24B4A]",
  warning: "bg-[#EF9F27]/10 text-[#EF9F27]",
  info:    "bg-[#185FA5]/10 text-[#185FA5]",
  neutral: "bg-gray-100 text-gray-500",
};

const statusMap: Record<string, StatusVariant> = {
  placed:                    "info",
  accepted:                  "warning",
  preparing:                 "warning",
  ready_for_rider:           "warning",
  rider_assigned:            "warning",
  picked_up:                 "info",
  out_for_delivery:          "info",
  reached_delivery_location: "info",
  delivered:                 "success",
  cancelled:                 "danger",
  paid:                      "success",
  failed:                    "danger",
  pending:                   "warning",
  active:                    "success",
  suspended:                 "danger",
  verified:                  "success",
  unverified:                "warning",
  online:                    "success",
  offline:                   "neutral",
  blocked:                   "danger",
};

const labelMap: Record<string, string> = {
  placed:                    "Placed",
  accepted:                  "Accepted",
  preparing:                 "Preparing",
  ready_for_rider:           "Ready",
  rider_assigned:            "Rider Assigned",
  picked_up:                 "Picked Up",
  out_for_delivery:          "Out for Delivery",
  reached_delivery_location: "At Location",
  delivered:                 "Delivered",
  cancelled:                 "Cancelled",
};

interface StatusChipProps {
  status: string;
  label?: string;
}

const StatusChip = ({ status, label }: StatusChipProps) => {
  const variant = statusMap[status] ?? "neutral";
  const text = label ?? labelMap[status] ?? status.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${variantStyles[variant]}`}>
      {text}
    </span>
  );
};

export default StatusChip;
