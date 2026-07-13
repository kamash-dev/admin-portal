import { NavLink, useFetcher, useLocation } from "@remix-run/react";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingCart,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "~/context/auth.context";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/categories", icon: FolderOpen, label: "Categories" },
  { to: "/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {

  const fetcher = useFetcher();
  
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const logout = () => {
    fetcher.submit(null, {
      method: "POST",
      action: "/action/logout",
    });
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-admin-sidebar text-white flex flex-col transition-all duration-300 z-40 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-admin-primary flex items-center justify-center shrink-0">
          <Shield size={20} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight truncate">
            Softborn Admin
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-admin-primary text-white"
                  : "text-slate-300 hover:bg-admin-sidebar-hover hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors w-full"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-admin-sidebar-hover hover:text-white transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight size={20} className="shrink-0" />
          ) : (
            <>
              <ChevronLeft size={20} className="shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
