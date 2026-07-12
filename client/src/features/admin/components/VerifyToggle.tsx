import { Loader2, Check, X } from "lucide-react";

interface VerifyToggleProps {
      isVerified: boolean;
      loading: boolean;
      onToggle: () => void;
      onDecline?: () => void;
}

const VerifyToggle = ({ isVerified, loading, onToggle, onDecline }: VerifyToggleProps) => {
      if (isVerified) {
            return (
                  <button
                        onClick={onToggle}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        Verified
                  </button>
            );
      }

      return (
            <div className="flex items-center gap-1.5">
                  <button
                        onClick={onToggle}
                        disabled={loading}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                        {loading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                        Accept
                  </button>
                  <button
                        disabled={loading}
                        onClick={onDecline}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                        <X size={11} />
                        Decline
                  </button>
            </div>
      );
};

export default VerifyToggle;
