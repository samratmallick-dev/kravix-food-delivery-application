import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";

const Login = () => {

      const [loading, setLoading] = useState(false);
      const navigate = useNavigate();
      const { fatchUser } = useAppData();

      const responseGoogle = async (authResult: any) => {
            setLoading(true);
            try {
                  if (!authResult?.code) throw new Error("Google login failed. Please try again.");

                  const apiUrl = import.meta.env.VITE_API_URL;
                  const result = await axios.post(`${apiUrl}/api/v1/auth/login`, {
                        code: authResult.code
                  }, { withCredentials: true });

                  localStorage.setItem("token", result.data.token);
                  await fatchUser();
                  toast.success(result.data.message);
                  navigate(result.data.data?.role ? "/home" : "/select-role");
            } catch (error: any) {
                  const message = error?.response?.data?.message ?? error?.message ?? "Something went wrong. Please try again.";
                  console.error(message.replace(/[\r\n]/g, " "));
                  toast.error(message);
            } finally {
                  setLoading(false);
            }
      };

      const googleLogin = useGoogleLogin({
            onSuccess: responseGoogle,
            onError: (err) => {
                  console.error(err);
                  toast.error("Google login failed. Please try again.");
                  setLoading(false);
            },
            flow: 'auth-code'
      });

      return (
            <div className="w-full min-h-screen bg-white px-4 flex justify-center items-center">
                  <div className="max-w-md w-full space-y-6">
                        <h1 className="text-center w-full flex items-center justify-center">
                              <span className="text-3xl font-extrabold text-gradient flex items-center gap-2">
                                    <UtensilsCrossed className="w-7 h-7 text-[#C22630]" /><span>আবার খাবো</span>
                              </span>
                        </h1>
                        <p className="text-center text-sm text-gray-500">Sign In / Sign Up to continue</p>
                        <button
                              onClick={googleLogin}
                              disabled={loading}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                              <FcGoogle size={20} /> {loading ? "Please Wait..." : "Continue with Google"}
                        </button>
                        <p className="text-center text-xs text-gray-400">
                              By continuing, you agree with our{" "}
                              <span className="text-sm text-gradient">Terms & Services</span> & {" "}
                              <span className="text-sm text-gradient">Privacy Policy</span>
                        </p>
                  </div>
            </div>
      );
}

export default Login;
