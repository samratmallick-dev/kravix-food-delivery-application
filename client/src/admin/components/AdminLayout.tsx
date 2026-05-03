import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminSidebar from "./AdminSidebar";
import { Menu, UtensilsCrossed } from "lucide-react";

const AdminLayout = () => {
      const { isAdminAuth } = useAdminAuth();
      const [sidebarOpen, setSidebarOpen] = useState(false);

      if (!isAdminAuth) return <Navigate to="/admin/login" replace />;

      return (
            <div className="flex h-screen overflow-hidden bg-background">
                  <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                  <div className="flex-1 flex flex-col min-w-0 h-screen">
                        {/* Mobile top bar */}
                        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
                              <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white cursor-pointer">
                                    <Menu size={22} />
                              </button>
                              <div className="flex items-center gap-2">
                                    <UtensilsCrossed size={18} className="text-primary" />
                                    <span className="text-white font-bold text-sm">আবার খাবো</span>
                              </div>
                        </header>
                        <main className="flex-1 overflow-y-auto">
                              <Outlet />
                        </main>
                  </div>
            </div>
      );
};

export default AdminLayout;
