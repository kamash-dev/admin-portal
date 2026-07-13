import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "@remix-run/react";
import { useAuth } from "~/context/auth.context";
import { useEffect } from "react";

const stats = [
  {
    label: "Total Revenue",
    value: "$45,231",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Total Orders",
    value: "1,284",
    change: "+8.2%",
    trend: "up" as const,
    icon: ShoppingCart,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Products",
    value: "356",
    change: "+3.1%",
    trend: "up" as const,
    icon: Package,
    color: "bg-violet-50 text-violet-600",
  },
  {
    label: "Customers",
    value: "2,847",
    change: "-1.4%",
    trend: "down" as const,
    icon: Users,
    color: "bg-amber-50 text-amber-600",
  },
];

const recentOrders = [
  {
    id: "ORD-7842",
    customer: "Sarah Johnson",
    amount: "$129.99",
    status: "Delivered",
    date: "Mar 28, 2026",
  },
  {
    id: "ORD-7841",
    customer: "Mike Chen",
    amount: "$89.50",
    status: "Shipped",
    date: "Mar 28, 2026",
  },
  {
    id: "ORD-7840",
    customer: "Emily Davis",
    amount: "$245.00",
    status: "Processing",
    date: "Mar 27, 2026",
  },
  {
    id: "ORD-7839",
    customer: "James Wilson",
    amount: "$67.80",
    status: "Pending",
    date: "Mar 27, 2026",
  },
  {
    id: "ORD-7838",
    customer: "Lisa Anderson",
    amount: "$312.00",
    status: "Delivered",
    date: "Mar 26, 2026",
  },
];

const statusConfig: Record<
  string,
  { icon: typeof Clock; color: string; bg: string }
> = {
  Pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  Processing: {
    icon: AlertCircle,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  Shipped: { icon: Truck, color: "text-violet-600", bg: "bg-violet-50" },
  Delivered: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
};

export default function Dashboard() {
  const { isLoggedIn   } = useAuth();
  console.log(isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      return navigate("/login");
    }
  }, [isLoggedIn]);
  
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-admin-border p-5 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
              >
                <stat.icon size={20} />
              </div>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  stat.trend === "up" ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-admin-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-admin-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
          <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1 text-sm text-admin-primary font-medium hover:underline"
          >
            View all
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Order
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {recentOrders.map((order) => {
                const cfg = statusConfig[order.status];
                const StatusIcon = cfg?.icon || Clock;
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-admin-bg/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">
                        {order.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {order.customer}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {order.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg?.bg} ${cfg?.color}`}
                      >
                        <StatusIcon size={12} />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-admin-muted">
                        {order.date}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/products"
          className="flex items-center gap-4 bg-white rounded-xl border border-admin-border p-5 hover:shadow-card-hover hover:border-admin-primary/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Manage Products</p>
            <p className="text-xs text-admin-muted">
              Add, edit or remove products
            </p>
          </div>
        </Link>

        <Link
          to="/orders"
          className="flex items-center gap-4 bg-white rounded-xl border border-admin-border p-5 hover:shadow-card-hover hover:border-admin-primary/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-100 transition-colors">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">View Orders</p>
            <p className="text-xs text-admin-muted">
              Track and manage all orders
            </p>
          </div>
        </Link>

        <Link
          to="/customers"
          className="flex items-center gap-4 bg-white rounded-xl border border-admin-border p-5 hover:shadow-card-hover hover:border-admin-primary/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Customers</p>
            <p className="text-xs text-admin-muted">
              View customer information
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
