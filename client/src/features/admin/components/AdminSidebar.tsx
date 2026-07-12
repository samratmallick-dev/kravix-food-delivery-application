import { LayoutDashboard, Users, Store, Bike, ShoppingBag, LogOut, UtensilsCrossed, X, BarChart3, Ticket, MessageSquare } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const links = [
      { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/analytics", icon: BarChart3,       label: "Analytics" },
      { to: "/admin/coupons",   icon: Ticket,          label: "Coupons" },
      { to: "/admin/reviews",   icon: MessageSquare,   label: "Reviews" },
      { to: "/admin/users",     icon: Users,           label: "Users" },
      { to: "/admin/restaurants", icon: Store,         label: "Restaurants" },
      { to: "/admin/riders",    icon: Bike,            label: "Riders" },
      { to: "/admin/orders",    icon: ShoppingBag,     label: "Orders" },
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
                        <div
                              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                              onClick={onClose}
                        />
                  )}

                  <aside className={`
                        fixed top-0 left-0 h-screen w-64 bg-gray-900 flex flex-col z-40 transition-transform duration-300
                        lg:static lg:h-screen lg:translate-x-0 lg:w-60 lg:shrink-0
                        ${isOpen ? "translate-x-0" : "-translate-x-full"}
                  `}>
                        <div className="px-5 py-5 border-b border-gray-700 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                    <UtensilsCrossed size={22} className="text-primary" />
                                    <div>
                                          <p className="text-white font-bold text-sm leading-tight">Kravix</p>
                                          <p className="text-gray-400 text-xs">Admin Panel</p>
                                    </div>
                              </div>
                              <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white cursor-pointer">
                                    <X size={18} />
                              </button>
                        </div>

                        <nav className="flex-1 px-3 py-4 space-y-1">
                              {links.map(({ to, icon: Icon, label }) => (
                                    <NavLink
                                          key={to}
                                          to={to}
                                          onClick={onClose}
                                          className={({ isActive }) =>
                                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                                      isActive
                                                            ? "bg-primary/20 text-primary border-l-2 border-primary pl-2.5"
                                                            : "text-gray-400 hover:text-white hover:bg-gray-800"
                                                }`
                                          }
                                    >
                                          <Icon size={18} />
                                          {label}
                                    </NavLink>
                              ))}
                        </nav>
                        <div className="px-3 py-4 border-t border-gray-700">
                              <button
                                    onClick={adminLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                              >
                                    <LogOut size={18} />
                                    Logout
                              </button>
                        </div>
                  </aside>
            </>
      );
};

export default AdminSidebar;
