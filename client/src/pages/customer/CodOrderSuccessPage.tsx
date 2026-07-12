import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";
import { useMobile } from "@/hooks/useMobile";

const CodOrderSuccess = () => {
      const { orderId } = useParams();
      const navigate = useNavigate();
      const isMobile = useMobile();

      useEffect(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
      }, []);

      return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                  <div className="max-w-md w-full bg-white rounded-lg shadow-lg text-center" style={{ padding: isMobile ? "24px 16px" : "32px" }}>
                        <div className="flex justify-center mb-4">
                              <span className="text-6xl">💵</span>
                        </div>
                        <div className="flex justify-center mb-4">
                              <CheckCircle className={`text-green-500 ${isMobile ? "w-10 h-10" : "w-14 h-14"}`} strokeWidth={1.5} />
                        </div>
                        <h1 className={`font-bold text-gray-900 mb-2 ${isMobile ? "text-xl" : "text-2xl"}`}>Order Placed!</h1>
                        <p className="text-gray-500 mb-2">Your order has been confirmed.</p>
                        <p className="text-sm text-orange-600 font-medium mb-2">Please keep cash or a payment method ready for the delivery partner.</p>
                        {orderId && (
                              <p className="text-xs text-gray-400 mb-6">Order ID: #{orderId.slice(-8).toUpperCase()}</p>
                        )}
                        <div className="flex flex-col gap-3">
                              <button
                                    onClick={() => navigate("/orders")}
                                    className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition"
                              >
                                    <ShoppingBag className="w-5 h-5" />
                                    Track My Order
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
};

export default CodOrderSuccess;
