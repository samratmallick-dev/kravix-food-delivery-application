import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminSidebar from "./AdminSidebar";
import { Menu } from "lucide-react";

const AdminLayout = () => {
  const { isAdminAuth } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdminAuth) return <Navigate to="/admin/login" replace />;

  return (
    <>
      {/* IBM Plex Sans + IBM Plex Mono */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        .admin-root, .admin-root * { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        .admin-root .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="admin-root flex h-screen overflow-hidden" style={{ backgroundColor: "#F1EFE8" }}>
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Mobile topbar */}
          <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-bold text-gray-800">আবার খাবো Admin</span>
          </header>

          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
