import { verifyStripePayment } from "../utils/payment.api";
import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";
import { useMobile } from "../components/common/useMobile";

const OrderSuccess = () => {
      const [params] = useSearchParams();
      const sessionId = params.get("session_id");
      const navigate = useNavigate();
      const hasVerified = useRef(false);
      const isMobile = useMobile();

      useEffect(() => {
            if (!sessionId || hasVerified.current) return;
            hasVerified.current = true;

            const verifyPayment = async () => {
                  try {
                        await verifyStripePayment(sessionId);

                        toast.success("Payment completed successfully! 🎉")
                  } catch (error) {
                        console.log(error);
                        toast.error("Payment verification failed!");                        
                  }
            };
            verifyPayment();
      },[sessionId]);
      return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                  <div className="max-w-md w-full bg-white rounded-lg shadow-lg text-center" style={{ padding: isMobile ? "24px 16px" : "32px" }}>
                        <div className="flex justify-center mb-4">
                              <CheckCircle className={`text-green-500 ${isMobile ? "w-14 h-14" : "w-20 h-20"}`} strokeWidth={1.5} />
                        </div>
                        <h1 className={`font-bold text-gray-900 mb-2 ${isMobile ? "text-xl" : "text-2xl"}`}>Order Successful!</h1>
                        <p className="text-gray-500 mb-8">Thank you for your order. Your food will be delivered soon.</p>
                        <div className="flex flex-col gap-3">
                              <button
                                    onClick={() => navigate("/orders")}
                                    className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition"
                              >
                                    <ShoppingBag className="w-5 h-5" />
                                    View My Orders
                              </button>
                              <button
                                    onClick={() => navigate("/")}
                                    className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-100 transition"
                              >
                                    <Home className="w-5 h-5" />
                                    Back to Home
                              </button>
                        </div>
                  </div>
            </div>
      );
}

export default OrderSuccess;
