import { memo } from "react";
import { LogOut, ShieldCheck, Star } from "lucide-react";
import type { IRider, User } from "@/types";
import StatusBadge from "../shared/StatusBadge";

interface HeroCardProps {
  user: User;
  profile: IRider;
  hasActiveOrder: boolean;
  onLogout: () => void;
}

const HeroCard = memo(({ user, profile, hasActiveOrder, onLogout }: HeroCardProps) => {
  const status = hasActiveOrder ? "busy" : profile.isAvailable ? "online" : "offline";

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "var(--gradient-rider)" }}>
      <div className="px-5 pt-6 pb-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/60 shrink-0">
          <img src={profile.picture} alt={user.name} className="w-full h-full object-cover object-top" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-base truncate">{user.name}</h2>
            {profile.isVerified && <ShieldCheck size={14} className="text-green-300 shrink-0" aria-label="Verified rider" />}
          </div>
          <p className="text-white/70 text-xs truncate">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge status={status} />
            {profile.rating !== null && (
              <span className="flex items-center gap-1 text-xs text-white/80">
                <Star size={11} className="fill-yellow-300 text-yellow-300" />
                {profile.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onLogout}
          aria-label="Logout"
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
        >
          <LogOut size={13} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/20 border-t border-white/20">
        {[
          { label: "Deliveries", value: profile.totalDeliveries },
          { label: "Rating",     value: profile.rating !== null ? `${profile.rating.toFixed(1)}/5` : "N/A" },
          { label: "Status",     value: profile.isVerified ? "Verified" : "Pending" },
        ].map(({ label, value }) => (
          <div key={label} className="py-3 text-center">
            <p className="text-white font-bold text-sm">{value}</p>
            <p className="text-white/60 text-xs">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
});

HeroCard.displayName = "HeroCard";
export default HeroCard;
