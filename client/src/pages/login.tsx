import axios from "axios";
import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { authBaseUrl } from "../components/common/constant";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";


const Login = () => {

      const [loading, setLoading] = useState(false);
      const navigate = useNavigate();

      const responseGoogle = async (authResult: any) => {
            setLoading(true);
            try {
                  const result = await axios.post(`${authBaseUrl}/api/v1/auth/login`, {
                        code: authResult["code"],
                  }, {withCredentials: true});
                  if (result.status === 200) {
                        localStorage.setItem("token", result.data.token);
                        toast.success(result.data.message || "Login Succesfull");
                        setLoading(false);
                        navigate("/");
                  } else {
                        toast.error(result.data.message || "Login failed");
                        setLoading(false);
                  }
            } catch (error: any) {
                  console.log(error);
                  toast.error(error.response?.data?.message || "Problem while login");
                  setLoading(false);
            }
      };

      const googleLogin = useGoogleLogin({
            onSuccess: responseGoogle,
            onError: responseGoogle,
            flow: "auth-code"
      });

      return (
            <div className="w-full min-h-screen bg-white px-4 flex justify-center items-center">
                  <div className="max-w-md w-full space-y-6">
                        <h1 className="text-center w-full flex items-center justify-center">
                              <span className="text-3xl font-extrabold text-gradient flex items-center gap-2">
                                    <UtensilsCrossed className="w-7 h-7 text-primary" /><span>আবার খাবো</span>
                              </span>
                        </h1>
                        <p className="text-center text-sm text-gray-500">Sign In / Sign Up to continue</p>
                        <button
                              onClick={googleLogin}
                              disabled={loading}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                              <FcGoogle size={20} /> {loading ? "Signing in...." : "Continue with Google"}
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
