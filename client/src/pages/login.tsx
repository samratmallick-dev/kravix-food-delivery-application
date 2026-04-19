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

      const responseGoogle = async (authResult: any) => {
            if (isProcessing.current) return;
            if (!authResult?.code) {
                  toast.error(authResult?.error_description || "Google login failed");
                  return;
            }

            isProcessing.current = true;
            setLoading(true);

            try {
                  const result = await axios.post(
                        `${authBaseUrl}/sessions`,
                        { code: authResult.code },
                        { withCredentials: true }
                  );

                  if (result.status === 200) {
                        localStorage.setItem("token", result.data.token);
                        setUser(result.data.data);
                        setIsAuth(true);
                        toast.success(result.data.message || "Login Successful");
                        navigate("/");
                  } else {
                        toast.error(result.data.message || "Login failed");
                  }
            } catch (error: any) {
                  console.error("Login error:", error);
                  toast.error(error.response?.data?.message || "Problem while login");
            } finally {
                  setLoading(false);
                  isProcessing.current = false;
            }
      };

      const googleLogin = useGoogleLogin({
            onSuccess: responseGoogle,
            onError: responseGoogle,
            flow: "auth-code",
      });

      return (
            <div className="w-full min-h-screen bg-white px-4 flex justify-center items-center">
                  <div className="max-w-md w-full space-y-6">
                        <h1 className="text-center w-full flex items-center justify-center">
                              <span className="text-3xl font-extrabold text-gradient flex items-center gap-2">
                                    <UtensilsCrossed className="w-7 h-7 text-primary" />
                                    <span>আবার খাবো</span>
                              </span>
                        </h1>
                        <p className="text-center text-sm text-gray-500">
                              Sign In / Sign Up to continue
                        </p>
                        <button
                              onClick={() => {
                                    if (loading) return;
                                    isProcessing.current = false; 
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