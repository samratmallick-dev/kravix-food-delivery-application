import axios from "axios";
import { UtensilsCrossed } from "lucide-react";
import { useRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { authBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { useAppData } from "../context/AppContext";

const Login = () => {
      const [loading, setLoading] = useState(false);
      const navigate = useNavigate();
      const { setUser, setIsAuth } = useAppData();
      const isProcessing = useRef(false);
      const retryCount = useRef(0);

      const responseGoogle = async (authResult: any) => {
            if (isProcessing.current || !authResult?.code) return;

            isProcessing.current = true;
            setLoading(true);

            const attemptLogin = async (code: string) => {
                  return axios.post(
                        `${authBaseUrl}/sessions`,
                        { code },
                        { withCredentials: true }
                  );
            };

            try {
                  let result;
                  try {
                        result = await attemptLogin(authResult.code);
                  } catch (firstErr: any) {
                        if (firstErr?.response || retryCount.current >= 1) {
                              retryCount.current = 0;
                              throw firstErr;
                        }
                        console.warn("Network error on login, re-triggering Google auth...");
                        retryCount.current += 1;
                        isProcessing.current = false;
                        setLoading(false);
                        setTimeout(() => googleLogin(), 300);
                        return;
                  }

                  retryCount.current = 0; // Reset on success
                  localStorage.setItem("token", result.data.token);
                  setUser(result.data.data);
                  setIsAuth(true);
                  toast.success(result.data.message || "Login Successful");
                  navigate("/");
            } catch (error: any) {
                  console.error("Login error:", error);
                  toast.error(error.response?.data?.message || "Server unreachable. Please try again later.");
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

      return (
            <div className="w-full min-h-screen bg-white px-4 flex justify-center items-center">
                  <div className="max-w-md w-full space-y-6">
                        <h1 className="text-center w-full flex items-center justify-center">
                              <span className="text-3xl font-extrabold text-gradient flex items-center gap-2">
                                    <UtensilsCrossed className="w-7 h-7 text-primary" />
                                    <span>Kravix</span>
                              </span>
                        </h1>
                        <p className="text-center text-sm text-gray-500">
                              Sign In / Sign Up to continue
                        </p>
                        <button
                              onClick={() => {
                                    if (loading) return;
                                    googleLogin();
                              }}
                              disabled={loading}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                              <FcGoogle size={20} />
                              {loading ? "Signing in...." : "Continue with Google"}
                        </button>
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