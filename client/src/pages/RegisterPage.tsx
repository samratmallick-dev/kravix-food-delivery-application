import { Eye, EyeOff, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { authBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";
import { useAppData } from "../context/AppContext";
import { storage } from "../utils/secureStorage";
import { registerWithEmail, resendVerificationEmail } from "../utils/auth.api";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { label: "", color: "" },
    { label: "Weak", color: "#ef4444" },
    { label: "Fair", color: "#f97316" },
    { label: "Good", color: "#eab308" },
    { label: "Strong", color: "#22c55e" },
  ];
  return { score, ...levels[score] };
}
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2 || name.trim().length > 50) {
      setError("Name must be between 2 and 50 characters.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError("Please provide a valid email address.");
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 8 characters with one uppercase letter and one digit.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await registerWithEmail({ name: name.trim(), email, password });
      setSuccess(data.message);
    } catch (err: unknown) {
      setError((err as Error).message ?? "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg("");
    try {
      const data = await resendVerificationEmail(email);
      setResendMsg(data.message);
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    }
  };

  const responseGoogle = async (authResult: { code?: string }) => {
    if (!authResult?.code) return;
    setGoogleLoading(true);
    try {
      const result = await axios.post(
        `${authBaseUrl}/sessions`,
        { code: authResult.code },
        { withCredentials: true }
      );
      storage.setToken(result.data.token);
      setUser(result.data.data);
      setIsAuth(true);
      toast.success(result.data.message || "Login Successful");
      navigate("/");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: (err) => console.error("Google OAuth error:", err),
    flow: "auth-code",
  });

  return (
    <div className="w-full min-h-screen bg-white px-4 flex justify-center items-center">
      <div className="max-w-md w-full space-y-6 py-8">
        <h1 className="text-center w-full flex items-center justify-center">
          <span className="text-3xl font-extrabold text-gradient flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-primary" />
            <span>Kravix</span>
          </span>
        </h1>
        <p className="text-center text-sm text-gray-500">Create your account</p>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-medium">{success}</p>
              <p className="text-sm text-gray-500 mt-1">
                We sent a link to <span className="font-medium">{email}</span>
              </p>
            </div>
            {resendMsg ? (
              <p className="text-sm text-green-600">{resendMsg}</p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-orange-500 underline cursor-pointer"
              >
                Resend email
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (() => {
                const { score, label, color } = getPasswordStrength(password);
                return (
                  <div className="mt-2 space-y-1">
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(score / 4) * 100}%`, backgroundColor: color }}
                      />
                    </div>
                    <p className="text-xs" style={{ color }}>Strength: {label}</p>
                  </div>
                );
              })()}
              <p className="text-xs text-gray-400 mt-1">
                Min 8 characters, one uppercase letter, one digit.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-2 rounded-md text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={() => { if (!googleLoading) googleLogin(); }}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <FcGoogle size={20} />
          {googleLoading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-500 font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
