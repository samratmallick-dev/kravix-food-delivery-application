import { Loader2 } from "lucide-react";

interface Props {
  isOnline: boolean;
  toggling: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

const RiderStatusToggle = ({ isOnline, toggling, disabled, onToggle }: Props) => (
  <div className="flex flex-col items-center gap-2">
    <button
      onClick={onToggle}
      disabled={disabled || toggling}
      aria-label={isOnline ? "Go offline" : "Go online"}
      aria-pressed={isOnline}
      className="relative focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isOnline && (
        <>
          <span className="absolute inset-0 rounded-full bg-[#1D9E75] opacity-30 animate-[ping_1.4s_ease-in-out_infinite]" />
          <span className="absolute inset-0 rounded-full bg-[#1D9E75] opacity-15 animate-[ping_1.4s_ease-in-out_infinite_0.4s]" />
        </>
      )}
      <span
        className={`relative flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300 ${
          isOnline
            ? "bg-[#1D9E75] border-[#1D9E75] shadow-[0_0_20px_rgba(29,158,117,0.5)]"
            : "bg-[#444441] border-[#555552]"
        }`}
      >
        {toggling ? (
          <Loader2 size={22} className="text-white animate-spin" />
        ) : (
          <span className={`w-3 h-3 rounded-full ${isOnline ? "bg-white" : "bg-[#888884]"}`} />
        )}
      </span>
    </button>
    <span
      className={`text-xs font-semibold font-mono tracking-widest uppercase ${
        isOnline ? "text-[#1D9E75]" : "text-[#888884]"
      }`}
    >
      {isOnline ? "Online" : "Offline"}
    </span>
  </div>
);

export default RiderStatusToggle;
