import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/navbar/logo";
import { forgotPassword } from "../utils/auth.api";
import SEO from "../components/common/SEO";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await forgotPassword(email);
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
        title="Forgot Password | Kravix"
        description="Reset your Kravix account password easily. Enter your email and we'll send you a password reset link."
        path="/forgot-password"
      />
      <div className="flex justify-center">
          <Logo auth />
        </div>
        <p className="text-center text-sm text-gray-500 font-semibold">Reset your password</p>

        {success ? (
          <div role="alert" className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-3">
            <p className="text-green-700 font-medium">{success}</p>
            <Link to="/login" className="text-sm text-primary hover:underline font-semibold">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
                aria-invalid={!!error}
                aria-describedby={error ? "forgot-password-error" : undefined}
              />
            </div>

            {error && <p id="forgot-password-error" role="alert" className="text-sm text-red-600 font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="text-center text-sm">
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Back to Sign In
              </Link>
            </p>
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

export default ForgotPasswordPage;
