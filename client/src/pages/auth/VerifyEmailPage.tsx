import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Logo from "@/components/common/Logo";
import { verifyEmail, resendVerificationEmail } from "@/services/api/auth.services";
import SEO from "@/components/common/SEO";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    verifyEmail(token)
      .then((data) => {
        setMessage(data.message);
        setStatus("success");
      })
      .catch((err: unknown) => {
        setMessage((err as Error).message ?? "Verification failed.");
        setStatus("error");
      });
  }, [token, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMsg("");
    try {
      const data = await resendVerificationEmail(resendEmail);
      setResendMsg(data.message);
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <SEO
        title="Verify Email | Kravix"
        description="Verify your email address to secure your Kravix account and start ordering delicious meals."
        path="/verify-email"
      />
      <div className="flex justify-center">
          <Logo auth />
        </div>

        {status === "loading" && (
          <div className="space-y-3" aria-live="polite" aria-busy="true">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
            <p className="text-gray-500 font-semibold">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4" role="alert" aria-live="polite">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-gray-700 font-semibold">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-primary text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-red-700"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4" role="alert" aria-live="polite">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-red-600 font-semibold">{message}</p>
            <form onSubmit={handleResend} className="space-y-3 text-left">
              <label htmlFor="resend-email-input" className="block text-sm font-medium text-gray-700">
                Resend verification email
              </label>
              <input
                id="resend-email-input"
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {resendMsg && (
                <p className="text-sm text-green-600 font-semibold">{resendMsg}</p>
              )}
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-md text-sm font-semibold hover:bg-red-700 cursor-pointer"
              >
                Resend verification email
              </button>
            </form>
          </div>
        )}
    </div>
  );
};

export default VerifyEmailPage;
