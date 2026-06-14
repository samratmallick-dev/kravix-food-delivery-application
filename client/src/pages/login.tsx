
import { Eye, EyeOff } from "lucide-react";
import Logo from "../components/navbar/logo";
import { useRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { useAppData } from "../context/AppContext";
import { storage } from "../utils/secureStorage";
import { loginWithEmail, resendVerificationEmail, loginWithGoogle as apiLoginWithGoogle } from "../utils/auth.api";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notVerified, setNotVerified] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppData();
  const isProcessing = useRef(false);
  const retryCount = useRef(0);

  const responseGoogle = async (authResult: { code?: string }) => {
    if (isProcessing.current || !authResult?.code) return;
    isProcessing.current = true;
    setLoading(true);

    const attemptLogin = async (code: string) => apiLoginWithGoogle(code);

    try {
      let data;
      try {
        data = await attemptLogin(authResult.code);
      } catch (firstErr: unknown) {
        if (retryCount.current >= 1) {
          retryCount.current = 0;
          throw firstErr;
        }
        retryCount.current += 1;
        isProcessing.current = false;
        setLoading(false);
        setTimeout(() => googleLogin(), 300);
        return;
      }
      retryCount.current = 0;
      storage.setToken(data.token!);
      setUser(data.user as any);
      setIsAuth(true);
      toast.success(data.message || "Login Successful");
      navigate("/");
    } catch (error: unknown) {
      toast.error(
        (error as Error).message ||
        "Server unreachable. Please try again later.",
      );
    } finally {
      setLoading(false);
      isProcessing.current = false;
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: (err) => console.error("Google OAuth error:", err),
    flow: "auth-code",
  });

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotVerified(false);
    setResendMsg("");
    setLoading(true);

    try {
      const data = await loginWithEmail({ email, password });

      if (data.token && data.user) {
        storage.setToken(data.token);
        setUser({
          _id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          image: data.user.profileImage,
          role: data.user.role,
          isEmailVerified: data.user.isEmailVerified,
          authProvider: data.user.authProvider,
        });
        setIsAuth(true);

        if (data.needsRoleSelection) {
          toast.success("Please select your role to continue.");
          navigate("/select-role");
        } else {
          toast.success("Login successful");
          navigate("/");
        }
      }
    } catch (err: unknown) {
      const e = err as { message?: string } & {
        response?: { data?: { message?: string; code?: string } };
      };
      const code = (err as { code?: string }).code;
      const msg = e.message ?? "Login failed";

      if (code === "EMAIL_NOT_VERIFIED" || msg.includes("verify your email")) {
        setNotVerified(true);
      } else {
        setError(msg);
      }
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

  return (
    <div className="w-full min-h-screen bg-white px-4 flex justify-center items-center">
      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <Logo auth />
        </div>
        <p className="text-center text-sm text-gray-500">Sign in to continue</p>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
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
          </div>

          {notVerified && (
            <div className="text-sm text-red-600 space-y-1">
              <p>Your email is not verified.</p>
              {resendMsg ? (
                <p className="text-green-600">{resendMsg}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-primary underline cursor-pointer"
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={() => {
            if (!loading) googleLogin();
          }}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-primary/30 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <FcGoogle size={20} />
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary font-medium hover:underline"
          >
            Register
          </Link>
        </p>
        <p className="text-center text-xs text-gray-400">
          By continuing, you agree with our{" "}
          <span className="text-sm text-gradient">Terms & Services</span> &{" "}
          <span className="text-sm text-gradient">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
