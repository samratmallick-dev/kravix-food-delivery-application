const statusConfig: Record<string, { label: string; className: string }> = {
      placed:          { label: "Placed",           className: "bg-blue-100 text-blue-700" },
      accepted:        { label: "Accepted",         className: "bg-yellow-100 text-yellow-700" },
      preparing:       { label: "Preparing",        className: "bg-yellow-100 text-yellow-700" },
      ready_for_rider: { label: "Ready for Rider",  className: "bg-orange-100 text-orange-700" },
      rider_assigned:  { label: "Rider Assigned",   className: "bg-orange-100 text-orange-700" },
      picked_up:       { label: "Picked Up",        className: "bg-purple-100 text-purple-700" },
      delivered:       { label: "Delivered",        className: "bg-green-100 text-green-700" },
      cancelled:       { label: "Cancelled",        className: "bg-red-100 text-red-700" },
};

const OrderStatusBadge = ({ status }: { status: string }) => {
      const cfg = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
      return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
                  {cfg.label}
            </span>
      );
};

export default OrderStatusBadge;
