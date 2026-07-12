import { memo } from "react";
import { Loader2 } from "lucide-react";

interface AvailabilityToggleProps {
  isAvailable: boolean;
  isOnDelivery: boolean;
  toggling: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

const AvailabilityToggle = memo(({ isAvailable, isOnDelivery, toggling, disabled, onToggle }: AvailabilityToggleProps) => {
  const active = isAvailable || isOnDelivery;

  return (
    <button
      onClick={onToggle}
      disabled={disabled || toggling || isOnDelivery}
      aria-label={active ? "Go offline" : "Go online"}
      className={`relative w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${active ? "bg-gray-600 hover:bg-gray-700" : "bg-linear-to-r from-primary to-[#e85d04] hover:opacity-90 pulse-ring"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5 ${active ? "bg-white/30" : "bg-white/20"}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${active ? "translate-x-4" : "translate-x-0"}`} />
        </div>
        <span className="text-sm">
          {isOnDelivery ? "On Delivery" : isAvailable ? "You're Online" : "You're Offline"}
        </span>
      </div>
      {toggling ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <span className="text-xs font-semibold opacity-80">
          {isOnDelivery ? "Active" : active ? "Tap to go offline" : "Tap to go online"}
        </span>
      )}
    </button>
  );
});

AvailabilityToggle.displayName = "AvailabilityToggle";
export default AvailabilityToggle;
