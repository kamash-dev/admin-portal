import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  User,
  MapPin,
  Hash,
  Calendar,
  Ban,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import {
  getOrderDetails,
  cancelOrder,
  returnOrder,
} from "~/services/order.server";
import type { OrderDetail, OrderStatus } from "~/types/order";

const statusConfig: Record<
  OrderStatus,
  { icon: typeof Clock; color: string; bg: string; border: string }
> = {
  PENDING: {
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  PAID: {
    icon: CreditCard,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  SHIPPED: {
    icon: Truck,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  DELIVERED: {
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  CANCELLED: {
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  RETURNED: {
    icon: RotateCcw,
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
  },
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!id) throw new Response("Order ID is required", { status: 400 });

  try {
    const order = await getOrderDetails(request, id);
    return { order, error: null };
  } catch (error) {
    return {
      order: null,
      error: error instanceof Error ? error.message : "Failed to load order",
    };
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params;
  if (!id) return { error: "Order ID is required" };

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "cancel") {
      await cancelOrder(request, id);
      return { success: "Order cancelled successfully" };
    }
    if (intent === "return") {
      await returnOrder(request, id);
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
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 font-mono text-xs bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors"
      title="Copy to clipboard"
    >
      <span className="max-w-[180px] truncate">{value}</span>
      {copied ? (
        <Check size={12} className="text-emerald-600 shrink-0" />
      ) : (
        <Copy size={12} className="text-slate-400 shrink-0" />
      )}
    </button>
  );
}

export default function OrderDetails() {
  const { order, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const isBusy = fetcher.state !== "idle";
  const actionError = (fetcher.data as { error?: string })?.error;
  const actionSuccess = (fetcher.data as { success?: string })?.success;

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm text-admin-muted hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle size={48} className="mx-auto text-red-300 mb-3" />
          <p className="text-sm font-semibold text-red-700">
            {error || "Order not found"}
          </p>
        </div>
      </div>
    );
  }

  const typedOrder = order as unknown as OrderDetail;
  const cfg = statusConfig[typedOrder.status] ?? statusConfig.PENDING;
  const StatusIcon = cfg.icon;
  const canCancel =
    typedOrder.status === "PENDING" || typedOrder.status === "PAID";
  const canReturn = typedOrder.status === "DELIVERED";

  const customerName = typedOrder.customer
    ? [typedOrder.customer.firstName, typedOrder.customer.lastName]
        .filter(Boolean)
        .join(" ") || typedOrder.customer.email
    : "Guest";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/orders"
            className="p-2 rounded-lg hover:bg-admin-bg text-admin-muted hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Order Details</h1>
            <div className="flex items-center gap-2 mt-1">
              <CopyableId value={typedOrder.id} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}
          >
            <StatusIcon size={14} />
            {statusLabels[typedOrder.status] ?? typedOrder.status}
          </span>

          {canCancel && (
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="cancel" />
              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Ban size={14} />
                )}
                Cancel Order
              </button>
            </fetcher.Form>
          )}
          {canReturn && (
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="return" />
              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {isBusy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RotateCcw size={14} />
                )}
                Process Return
              </button>
            </fetcher.Form>
          )}
        </div>
      </div>

      {actionError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
          <CheckCircle2 size={16} />
          {actionSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
            <div className="px-6 py-4 border-b border-admin-border">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Package size={16} className="text-admin-primary" />
                Ordered Products ({typedOrder.items.length})
              </h2>
            </div>

            <div className="divide-y divide-admin-border">
              {typedOrder.items.map((item) => {
                const image = item.variant.images?.[0];
                return (
                  <div
                    key={item.id}
                    className="px-6 py-4 flex items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-admin-border overflow-hidden flex-shrink-0">
                      {image ? (
                        <img
                          src={image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={20} className="text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {item.variant.color && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-admin-muted">
                            <span
                              className="w-3 h-3 rounded-full border border-slate-200"
                              style={{ backgroundColor: item.variant.color }}
                            />
                            {item.variant.color}
                          </span>
                        )}
                        {item.variant.size && (
                          <span className="text-xs text-admin-muted">
                            Size: {item.variant.size}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatAmount(item.lineTotal)}
                      </p>
                      <p className="text-xs text-admin-muted mt-0.5">
                        {formatAmount(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Total */}
            <div className="px-6 py-4 border-t border-admin-border bg-admin-bg/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">
                  Order Total
                </span>
                <span className="text-lg font-bold text-slate-900">
                  {formatAmount(typedOrder.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
            <div className="px-5 py-4 border-b border-admin-border">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <User size={16} className="text-admin-primary" />
                Customer
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {customerName}
                </p>
                {typedOrder.customer?.email && (
                  <p className="text-xs text-admin-muted mt-0.5">
                    {typedOrder.customer.email}
                  </p>
                )}
              </div>
              {typedOrder.customer?.id && (
                <div>
                  <p className="text-xs text-admin-muted mb-1">User ID</p>
                  <CopyableId value={typedOrder.customer.id} />
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
            <div className="px-5 py-4 border-b border-admin-border">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MapPin size={16} className="text-admin-primary" />
                Delivery Address
              </h2>
            </div>
            <div className="px-5 py-4">
              {typedOrder.deliveryAddress ? (
                <div className="space-y-1">
                  <p className="text-sm text-slate-900">
                    {typedOrder.deliveryAddress.street}
                  </p>
                  <p className="text-sm text-slate-700">
                    {typedOrder.deliveryAddress.city},{" "}
                    {typedOrder.deliveryAddress.state}{" "}
                    {typedOrder.deliveryAddress.postalCode}
                  </p>
                  <p className="text-sm text-slate-700">
                    {typedOrder.deliveryAddress.country}
                  </p>
                  <p className="text-xs text-admin-muted mt-2">
                    Phone: {typedOrder.deliveryAddress.phone}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-admin-muted italic">
                  No address on file
                </p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
            <div className="px-5 py-4 border-b border-admin-border">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <CreditCard size={16} className="text-admin-primary" />
                Payment
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-admin-muted">Method</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    typedOrder.paymentMode === "ONLINE"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {typedOrder.paymentMode === "ONLINE" ? (
                    <CreditCard size={12} />
                  ) : (
                    <Banknote size={12} />
                  )}
                  {typedOrder.paymentMode === "ONLINE"
                    ? "Online Payment"
                    : "Cash on Delivery"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-admin-muted">Amount</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatAmount(typedOrder.totalAmount)}
                </span>
              </div>
              {typedOrder.razorpayOrderId && (
                <div>
                  <p className="text-xs text-admin-muted mb-1">
                    Razorpay Order ID
                  </p>
                  <CopyableId value={typedOrder.razorpayOrderId} />
                </div>
              )}
              {typedOrder.razorpayPaymentId && (
                <div>
                  <p className="text-xs text-admin-muted mb-1">
                    Razorpay Payment ID
                  </p>
                  <CopyableId value={typedOrder.razorpayPaymentId} />
                </div>
              )}
              {!typedOrder.razorpayOrderId &&
                !typedOrder.razorpayPaymentId && (
                  <p className="text-xs text-admin-muted italic">
                    No payment details available
                  </p>
                )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
            <div className="px-5 py-4 border-b border-admin-border">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-admin-primary" />
                Timeline
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-admin-muted">Created</span>
                <span className="text-xs text-slate-700">
                  {formatDate(typedOrder.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-admin-muted">Last Updated</span>
                <span className="text-xs text-slate-700">
                  {formatDate(typedOrder.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
