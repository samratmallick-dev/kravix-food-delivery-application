import {
  LayoutDashboard, ShoppingBag, Users, Store, Bike,
  BarChart2, DollarSign, Settings, LogOut, UtensilsCrossed, X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const NAV_LINKS = [
  { to: "/admin/dashboard",   icon: LayoutDashboard, label: "Overview" },
  { to: "/admin/orders",      icon: ShoppingBag,     label: "Orders" },
  { to: "/admin/users",       icon: Users,           label: "Users" },
  { to: "/admin/restaurants", icon: Store,           label: "Restaurants" },
  { to: "/admin/riders",      icon: Bike,            label: "Riders" },
  { to: "/admin/finances",    icon: DollarSign,      label: "Finances" },
  { to: "/admin/analytics",   icon: BarChart2,       label: "Analytics" },
  { to: "/admin/settings",    icon: Settings,        label: "Settings" },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const { adminLogout } = useAdminAuth();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col z-40
          transition-transform duration-300 lg:static lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ boxShadow: "1px 0 0 #f0f0f0" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#185FA5] flex items-center justify-center shrink-0">
              <UtensilsCrossed size={16} className="text-white" />
            </div>
            <div>
              <p className="text-gray-800 font-bold text-sm leading-tight">আবার খাবো</p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#185FA5]/10 text-[#185FA5] uppercase tracking-wide">
                Admin
              </span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600 cursor-pointer p-1">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive
                    ? "bg-[#185FA5]/8 text-[#185FA5]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#185FA5] rounded-r-full" />
                  )}
                  <Icon size={16} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Admin footer */}
        <div className="px-3 py-4 border-t border-gray-100 shrink-0 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-[#185FA5] flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">A</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">Administrator</p>
              <p className="text-[10px] text-gray-400 truncate">admin@abarkhabo.com</p>
            </div>
          </div>
          <button
            onClick={adminLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-[#E24B4A] hover:bg-[#E24B4A]/5 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
