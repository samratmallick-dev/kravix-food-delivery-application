import { Loader2 } from "lucide-react";

interface VerifyToggleProps {
      isVerified: boolean;
      loading: boolean;
      onToggle: () => void;
}

const VerifyToggle = ({ isVerified, loading, onToggle }: VerifyToggleProps) => (
      <button
            onClick={onToggle}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer ${
                  isVerified
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
            }`}
      >
            {loading ? (
                  <Loader2 size={12} className="animate-spin" />
            ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? "bg-green-500" : "bg-yellow-500"}`} />
            )}
            {isVerified ? "Verified" : "Pending"}
      </button>
);

export default VerifyToggle;
