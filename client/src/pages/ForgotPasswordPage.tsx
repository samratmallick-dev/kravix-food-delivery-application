import { useState } from "react";
import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { forgotPassword } from "../utils/auth.api";

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
    <div className="w-full min-h-screen bg-white px-4 flex justify-center items-center">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-center w-full flex items-center justify-center">
          <span className="text-3xl font-extrabold text-gradient flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-primary" />
            <span>Kravix</span>
          </span>
        </h1>
        <p className="text-center text-sm text-gray-500">Reset your password</p>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-3">
            <p className="text-green-700 font-medium">{success}</p>
            <Link to="/login" className="text-sm text-orange-500 hover:underline">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="you@example.com"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-2 rounded-md text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="text-center text-sm">
              <Link to="/login" className="text-orange-500 hover:underline">
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
