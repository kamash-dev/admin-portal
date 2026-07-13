import { useLocation } from "@remix-run/react";
import { Bell, Search } from "lucide-react";
import { useAuth } from "~/context/auth.context";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Products",
  "/orders": "Orders",
  "/customers": "Customers",
  "/settings": "Settings",
};

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();

  const title = pageTitles[location.pathname] || "Admin Portal";

  return (
    <header className="h-16 bg-white border-b border-admin-border flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 bg-admin-bg border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
          />
        </div>

        <button className="relative p-2 text-admin-muted hover:text-slate-700 hover:bg-admin-bg rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-admin-danger rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-admin-border">
          <div className="w-8 h-8 rounded-full bg-admin-primary/10 flex items-center justify-center text-admin-primary font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              {user?.name}
            </p>
            <p className="text-xs text-admin-muted leading-tight">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
