import { memo } from "react";
import { CheckCircle2, IndianRupee } from "lucide-react";
import type { IOrder } from "@/types";
import SectionCard from "@/components/ui/SectionCard";

interface TransactionListProps {
  history: IOrder[];
}

const TransactionList = memo(({ history }: TransactionListProps) => {
  const delivered = history.filter((o) => o.status === "delivered").slice(0, 20);

  return (
    <SectionCard title="Transaction History">
      {delivered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {delivered.map((order) => (
            <div key={order._id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{order.restaurantName}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {order.paymentMethod === "cod" && <span className="ml-1 text-orange-500">· COD</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 text-sm font-bold text-green-600 shrink-0">
                <IndianRupee size={12} />{order.riderAmount}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
});

TransactionList.displayName = "TransactionList";
export default TransactionList;
