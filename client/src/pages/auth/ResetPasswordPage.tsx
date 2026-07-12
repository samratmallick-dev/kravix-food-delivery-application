import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Logo from "@/components/common/Logo";
import { resetPassword } from "@/services/api/auth.services";
import SEO from "@/components/common/SEO";

function getStrength(pw: string): { label: string; color: string; width: string; score: number } {
  if (pw.length === 0) return { label: "", color: "bg-gray-200", width: "w-0", score: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-400", width: "w-1/4", score: 1 };
  if (score === 2) return { label: "Fair", color: "bg-orange-400", width: "w-2/4", score: 2 };
  if (score === 3) return { label: "Good", color: "bg-primary", width: "w-3/4", score: 3 };
  return { label: "Strong", color: "bg-green-500", width: "w-full", score: 4 };
}

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) navigate("/forgot-password", { replace: true });
  }, [token, navigate]);

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword({ token: token!, newPassword });
      setSuccess(data.message);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <SEO
        title="Reset Password | Kravix"
        description="Choose a new secure password for your Kravix account and get back to ordering food."
        path="/reset-password"
      />
      <div className="flex justify-center">
          <Logo auth />
        </div>
        <p className="text-center text-sm text-gray-500 font-semibold">Choose a new password</p>

        {success ? (
          <div role="alert" className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-3">
            <p className="text-green-700 font-medium">{success}</p>
            <Link to="/login" className="text-sm text-primary hover:underline font-semibold">
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password-input" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  id="new-password-input"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  placeholder="••••••••"
                  aria-invalid={!!error}
                  aria-describedby={error ? "reset-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div 
                    className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={strength.score}
                    aria-valuemin={0}
                    aria-valuemax={4}
                    aria-valuetext={`Password strength: ${strength.label}`}
                  >
                    <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-xs text-gray-500 font-semibold">Strength: {strength.label}</p>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirm-password-input" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password-input"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  placeholder="••••••••"
                  aria-invalid={!!error}
                  aria-describedby={error ? "reset-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div id="reset-error" role="alert" className="text-sm text-red-600 space-y-1">
                <p className="font-semibold">{error}</p>
                {error.toLowerCase().includes("invalid") || error.toLowerCase().includes("expired") ? (
                  <Link to="/forgot-password" className="text-primary underline font-semibold">
                    Request a new reset link
                  </Link>
                ) : null}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
        <p className="text-center text-xs text-gray-400 mt-4">
          By continuing, you agree with our{" "}
          <Link to="/terms" className="text-xs text-primary hover:underline font-semibold">Terms & Services</Link> &{" "}
          <Link to="/privacy" className="text-xs text-primary hover:underline font-semibold">Privacy Policy</Link>
        </p>
    </div>
  );
};

export default ResetPasswordPage;
