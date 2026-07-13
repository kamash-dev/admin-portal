import { useState } from "react";
import { useLoaderData, useSearchParams, useFetcher, Link } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  Search,
  Filter,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Ban,
  CreditCard,
  Package,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  getAdminOrders,
  cancelOrder,
  returnOrder,
} from "~/services/order.server";
import type { Order, OrderStatus, Pagination } from "~/types/order";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/popover";

const ITEMS_PER_PAGE = 10;

const statusConfig: Record<
  OrderStatus,
  { icon: typeof Clock; color: string; bg: string }
> = {
  PENDING: { icon: Clock, color: "text-amber-700", bg: "bg-amber-50" },
  PAID: { icon: CreditCard, color: "text-blue-700", bg: "bg-blue-50" },
  SHIPPED: { icon: Truck, color: "text-violet-700", bg: "bg-violet-50" },
  DELIVERED: { icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50" },
  CANCELLED: { icon: XCircle, color: "text-red-700", bg: "bg-red-50" },
  RETURNED: { icon: RotateCcw, color: "text-slate-700", bg: "bg-slate-100" },
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

const tabs: ("ALL" | OrderStatus)[] = [
  "ALL",
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1") || 1;
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  try {
    const data = await getAdminOrders(request, {
      page,
      limit: ITEMS_PER_PAGE,
      status: status === "ALL" ? undefined : status,
      search,
    });
    return { orders: data.orders, pagination: data.pagination, error: null };
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return {
      orders: [] as Order[],
      pagination: { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 1 } as Pagination,
      error: error instanceof Error ? error.message : "Failed to load orders",
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const orderId = formData.get("orderId") as string;

  try {
    if (intent === "cancel") {
      await cancelOrder(request, orderId);
      return { success: "Order cancelled successfully" };
    }
    if (intent === "return") {
      await returnOrder(request, orderId);
      return { success: "Return processed successfully" };
    }
    return { error: "Unknown action" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Action failed",
    };
  }
};

function formatAmount(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function getUserName(order: Order) {
  if (!order.user) return "Guest";
  return [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || order.user.email;
}

export default function Orders() {
  const { orders, pagination, error } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher<typeof action>();

  const isBusy = fetcher.state !== "idle";
  const actionError = (fetcher.data as { error?: string })?.error;
  const actionSuccess = (fetcher.data as { success?: string })?.success;

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentPage = parseInt(searchParams.get("page") || "1") || 1;

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "" || val === "ALL") {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput || null, page: null });
  };

  const handleTabChange = (tab: string) => {
    updateParams({ status: tab === "ALL" ? null : tab, page: null });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage > 1 ? String(newPage) : null });
  };

  const handleAction = (orderId: string, intent: "cancel" | "return" | "confirm") => {
    const fd = new FormData();
    fd.append("intent", intent);
    fd.append("orderId", orderId);
    fetcher.submit(fd, { method: "post" });
    setMenuOpen(null);
  };

  const canCancel = (status: OrderStatus) =>
    status === "PENDING" || status === "PAID";
  const canReturn = (status: OrderStatus) => status === "DELIVERED";
  const canConfirm = (status: OrderStatus) => status === "PENDING";

  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1
  ).filter(
    (p) =>
      p === 1 ||
      p === pagination.totalPages ||
      Math.abs(p - currentPage) <= 1
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-admin-danger font-medium">
          {error}
        </div>
      )}

      {actionError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-admin-danger font-medium">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
          <CheckCircle2 size={16} />
          {actionSuccess}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
          />
          <input
            type="text"
            placeholder="Search by ID, email, name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
          />
        </form>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              currentStatus === tab
                ? "bg-admin-primary text-white"
                : "bg-white text-slate-600 border border-admin-border hover:bg-admin-bg"
            }`}
          >
            {tab === "ALL" ? "All" : statusLabels[tab]}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Order ID
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Items
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Total
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {(orders as Order[]).map((order) => {
                const cfg = statusConfig[order.status] ?? statusConfig.PENDING;
                const StatusIcon = cfg.icon;
                const hasActions = true;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-admin-bg/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-sm font-semibold text-admin-primary hover:underline font-mono"
                        title={order.id}
                      >
                        {order.id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {getUserName(order)}
                        </p>
                        {order.user?.email && (
                          <p className="text-xs text-admin-muted">
                            {order.user.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {formatAmount(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
                      >
                        <StatusIcon size={12} />
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-admin-muted">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end relative">
                        {hasActions ? (
                          <>
                            <button
                              onClick={() =>
                                setMenuOpen(
                                  menuOpen === order.id ? null : order.id
                                )
                              }
                              disabled={isBusy}
                              className="p-1.5 rounded-md hover:bg-admin-bg text-admin-muted hover:text-slate-700 transition-colors disabled:opacity-50"
                            >
                              <Popover>
                                <PopoverTrigger>
                                  <MoreHorizontal size={18} />
                                </PopoverTrigger>
                                <PopoverContent className="bg-white border border-admin-border rounded-lg shadow-lg w-fit mr-7">
                                  <div className="flex flex-col gap-2">
                                    <Link
                                      to={`/orders/${order.id}`}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-admin-bg transition-colors"
                                    >
                                      <Eye size={14} />
                                      View Details
                                    </Link>
                                    {
                                      canConfirm(order.status) && (
                                        <button onClick={() => handleAction(order.id, "confirm")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-admin-primary hover:bg-admin-primary/5 transition-colors disabled:opacity-50">
                                          <CheckCircle2 size={14} />
                                          Confirm Order
                                        </button>
                                      )
                                    }
                                    {canCancel(order.status) && (
                                      <button onClick={() => handleAction(order.id, "cancel")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-admin-danger hover:bg-red-50 transition-colors disabled:opacity-50">
                                        <Ban size={14} />
                                        Cancel Order
                                      </button>
                                    )}
                                    {canReturn(order.status) && (
                                      <button onClick={() => handleAction(order.id, "return")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-admin-bg transition-colors disabled:opacity-50">
                                        <RotateCcw size={14} />
                                        Process Return
                                      </button>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              {/* <MoreHorizontal size={18} /> */}
                            </button>
                            {/* {menuOpen === order.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setMenuOpen(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-admin-border py-1 z-20">
                                  {canCancel(order.status) && (
                                    <button
                                      onClick={() =>
                                        handleAction(order.id, "cancel")
                                      }
                                      disabled={isBusy}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-admin-danger hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                      <Ban size={14} />
                                      Cancel Order
                                    </button>
                                  )}
                                  {canReturn(order.status) && (
                                    <button
                                      onClick={() =>
                                        handleAction(order.id, "return")
                                      }
                                      disabled={isBusy}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-admin-bg transition-colors disabled:opacity-50"
                                    >
                                      <RotateCcw size={14} />
                                      Process Return
                                    </button>
                                  )}
                                </div>
                              </>
                            )} */}
                          </>
                        ) : (
                          <span className="text-xs text-admin-muted">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="py-16 text-center">
            <Package size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-900">
              No orders found
            </p>
            <p className="text-sm text-admin-muted mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border">
          <p className="text-sm text-admin-muted">
            Showing{" "}
            <span className="font-medium text-slate-900">
              {orders.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900">
              {pagination.total}
            </span>{" "}
            orders
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg hover:bg-admin-bg text-admin-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {pageNumbers.map((p, i) => {
              const prev = pageNumbers[i - 1];
              const showGap = prev != null && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-1">
                  {showGap && (
                    <span className="px-1 text-sm text-admin-muted">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      p === currentPage
                        ? "bg-admin-primary text-white"
                        : "hover:bg-admin-bg text-admin-muted"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="p-2 rounded-lg hover:bg-admin-bg text-admin-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
