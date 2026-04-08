import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { UtensilsCrossed, Loader2, Mail, Lock } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminLogin = () => {
      const { adminLogin, isAdminAuth } = useAdminAuth();
      const navigate = useNavigate();
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const [loading, setLoading] = useState(false);

      if (isAdminAuth) return <Navigate to="/admin/dashboard" replace />;

      const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setLoading(true);
            const ok = await adminLogin(email, password);
            setLoading(false);
            if (ok) navigate("/admin/dashboard");
      };

      return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
                  <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-primary px-8 py-7 flex flex-col items-center gap-2">
                              <UtensilsCrossed size={32} className="text-white" />
                              <h1 className="text-white text-xl font-bold">আবার খাবো</h1>
                              <p className="text-red-200 text-xs">Admin Panel</p>
                        </div>

                        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
                              <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <Mail size={15} className="text-gray-400 shrink-0" />
                                          <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="admin@abarkhabo.com"
                                                required
                                                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                                          />
                                    </div>
                              </div>

                              <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
                                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary transition-colors">
                                          <Lock size={15} className="text-gray-400 shrink-0" />
                                          <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
                                          />
                                    </div>
                              </div>

                              <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                    {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : "Sign In"}
                              </button>
                        </form>
                  </div>
            </div>
      );
};

export default AdminLogin;
