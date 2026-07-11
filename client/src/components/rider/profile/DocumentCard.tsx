import { memo } from "react";
import { FileText, CreditCard, CheckCircle2, Clock } from "lucide-react";
import type { IRider } from "../../../types/types";
import SectionCard from "../../ui/SectionCard";

interface DocumentCardProps {
  profile: IRider;
}

const DocRow = memo(({ icon, label, value, verified }: { icon: React.ReactNode; label: string; value: string; verified: boolean }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
    </div>
    <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
      {verified ? <CheckCircle2 size={10} /> : <Clock size={10} />}
      {verified ? "Verified" : "Pending"}
    </span>
  </div>
));

const DocumentCard = memo(({ profile }: DocumentCardProps) => (
  <SectionCard title="Documents">
    <div className="-my-1">
      <DocRow
        icon={<FileText size={16} />}
        label="Driving License"
        value={profile.drivingLicesce}
        verified={profile.isVerified}
      />
      <DocRow
        icon={<CreditCard size={16} />}
        label="Aadhaar Card"
        value={`XXXX-XXXX-${profile.aadhaarNumber.slice(-4)}`}
        verified={profile.isVerified}
      />
      {profile.panNumber && (
        <DocRow
          icon={<CreditCard size={16} />}
          label="PAN Card"
          value={profile.panNumber.toUpperCase()}
          verified={profile.isVerified}
        />
      )}
    </div>
  </SectionCard>
));

DocumentCard.displayName = "DocumentCard";
DocRow.displayName = "DocRow";
export default DocumentCard;
