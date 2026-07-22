import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate, useLoaderData, Form } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import type { DateRange } from "react-day-picker";
import { useAuth } from "~/context/auth.context";
import { useEffect, useState } from "react";
import { getDashboardStats } from "~/services/dashboard.server";
import { DateRangePicker } from "~/components/date-range-picker";

const toISODate = (d?: Date) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    : "";

const parseISODate = (s: string) => (s ? new Date(`${s}T00:00:00`) : undefined);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate") || undefined;
  const endDate = url.searchParams.get("endDate") || undefined;

  try {
    const stats = await getDashboardStats(request, { startDate, endDate });
    return {
      stats,
      error: null,
      startDate: startDate ?? "",
      endDate: endDate ?? "",
    };
  } catch (error) {
    // Let the 401 session-expiry redirect (a thrown Response) reach Remix.
    if (error instanceof Response) throw error;
    return {
      stats: null,
      error:
        error instanceof Error ? error.message : "Failed to load dashboard stats",
      startDate: startDate ?? "",
      endDate: endDate ?? "",
    };
  }
};

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
  const { stats, error, startDate, endDate } = useLoaderData<typeof loader>();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [range, setRange] = useState<DateRange | undefined>({
    from: parseISODate(startDate),
    to: parseISODate(endDate),
  });

  // Keep the picker in sync with the URL (e.g. after "Clear" navigates to "/").
  useEffect(() => {
    setRange({ from: parseISODate(startDate), to: parseISODate(endDate) });
  }, [startDate, endDate]);

  useEffect(() => {
    if (!isLoggedIn) {
      return navigate("/login");
    }
  }, [isLoggedIn]);

  const statCards = [
    {
      label: "Total Revenue",
      value: stats ? `₹${stats.totalRevenue.toLocaleString()}` : "—",
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Orders",
      value: stats ? stats.totalOrders.toLocaleString() : "—",
      icon: ShoppingCart,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Products",
      value: stats ? stats.totalProducts.toLocaleString() : "—",
      icon: Package,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Customers",
      value: stats ? stats.totalCustomers.toLocaleString() : "—",
      icon: Users,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Form
        method="get"
        className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-admin-border p-4"
      >
        <input type="hidden" name="startDate" value={toISODate(range?.from)} />
        <input type="hidden" name="endDate" value={toISODate(range?.to)} />
        <DateRangePicker value={range} onChange={setRange} />
        <button
          type="submit"
          className="px-4 py-2 bg-admin-primary text-white rounded-lg text-sm font-semibold hover:bg-admin-primary-hover transition-colors"
        >
          Apply
        </button>
        {(startDate || endDate) && (
          <Link
            to="/"
            className="px-4 py-2 border border-admin-border rounded-lg text-sm font-medium text-slate-700 hover:bg-admin-bg transition-colors"
          >
            Clear
          </Link>
        )}
      </Form>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-admin-danger font-medium">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
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
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-admin-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      {/* <div className="bg-white rounded-xl border border-admin-border">
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
      </div> */}

      {/* Quick Actions */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      </div> */}
    </div>
  );
}
