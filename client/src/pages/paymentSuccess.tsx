import { useParams, useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

const PaymentSuccess = () => {
      const { fetchCart } = useAppData();
      const { paymentId } = useParams<{ paymentId: string }>();
      const navigate = useNavigate();

      useEffect(() => {
            fetchCart();
      }, []);

      return (
            <div className="container-app min-h-[calc(100vh-80px)] flex items-center justify-center py-10">
                  <div className="bg-white rounded-2xl shadow-sm border border-border p-8 max-w-md w-full text-center space-y-5">
                        <div className="flex items-center justify-center">
                              <div className="flex justify-center mb-4">
                                    <CheckCircle className="w-20 h-20 text-green-500" strokeWidth={1.5} />
                              </div>
                        </div>

                        <div>
                              <h1 className="text-2xl font-bold text-gray-800">Payment Successful! 🎉</h1>
                              <p className="text-gray-500 text-sm mt-1">Your order has been placed and is being prepared.</p>
                        </div>

                        {paymentId && (
                              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-border">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment ID</p>
                                    <p className="text-sm font-medium text-gray-700 break-all">{paymentId}</p>
                              </div>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                              <button
                                    onClick={() => navigate("/")}
                                    className="w-full py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 transition active:scale-95"
                              >
                                    Order More
                              </button>
                              <button
                                    onClick={() => navigate("/orders")}
                                    className="w-full py-3 rounded-xl font-semibold text-primary border border-primary hover:bg-primary/5 transition active:scale-95"
                              >
                                    Your orders
                              </button>
                        </div>
                  </div>
            </div>
      );
}

export default PaymentSuccess;
