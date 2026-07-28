import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  Plus,
  Search,
  Ticket,
  Edit,
  Trash2,
  X,
  Loader2,
  ShoppingCart,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from "~/services/promo.server";
import type { PromoCode, CreatePromoInput, PromoOrder } from "~/types/promo";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const promos = await getPromoCodes(request);
    return { promos: promos ?? [], error: null };
  } catch (error) {
    console.error("Failed to fetch promo codes:", error);
    return {
      promos: [] as PromoCode[],
      error: error instanceof Error ? error.message : "Failed to load promo codes",
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  const buildInput = (): CreatePromoInput => ({
    code: String(formData.get("code") || ""),
    description: (formData.get("description") as string) || undefined,
    discountPercent: Number(formData.get("discountPercent") || 0),
    minOrderValue: Number(formData.get("minOrderValue") || 0),
    maxDiscount: formData.get("maxDiscount")
      ? Number(formData.get("maxDiscount"))
      : null,
    startDate: String(formData.get("startDate") || ""),
    endDate: String(formData.get("endDate") || ""),
    isActive: formData.get("isActive") === "true",
  });

  try {
    if (intent === "create") {
      const result = await createPromoCode(request, buildInput());
      if (result.error) return { error: result.error };
      return { success: "Promo code created successfully" };
    }

    if (intent === "update") {
      const id = formData.get("id") as string;
      const result = await updatePromoCode(request, id, buildInput());
      if (result.error) return { error: result.error };
      return { success: "Promo code updated successfully" };
    }

    if (intent === "delete") {
      const id = formData.get("id") as string;
      const result = await deletePromoCode(request, id);
      if (result.error) return { error: result.error };
      return { success: "Promo code deleted successfully" };
    }

    return { error: "Unknown action" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
};

interface ModalState {
  open: boolean;
  mode: "create" | "edit";
  promo?: PromoCode;
}

interface PromoForm {
  code: string;
  description: string;
  discountPercent: string;
  minOrderValue: string;
  maxDiscount: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Convert an ISO string into the value format expected by <input type="datetime-local">
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDates() {
  const now = new Date();
  const inMonth = new Date();
  inMonth.setMonth(inMonth.getMonth() + 1);
  return { start: toLocalInput(now.toISOString()), end: toLocalInput(inMonth.toISOString()) };
}

const emptyForm = (): PromoForm => {
  const { start, end } = defaultDates();
  return {
    code: "",
    description: "",
    discountPercent: "10",
    minOrderValue: "0",
    maxDiscount: "",
    startDate: start,
    endDate: end,
    isActive: true,
  };
};

function getStatus(promo: PromoCode): {
  label: string;
  className: string;
} {
  const now = new Date();
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);

  if (!promo.isActive)
    return { label: "Inactive", className: "bg-slate-100 text-slate-600" };
  if (now < start)
    return { label: "Scheduled", className: "bg-amber-50 text-amber-700" };
  if (now > end)
    return { label: "Expired", className: "bg-red-50 text-admin-danger" };
  return { label: "Active", className: "bg-emerald-50 text-emerald-700" };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number) {
  return `₹${amount}`;
}

export default function Promos() {
  const { promos, error: loadError } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ error: string | null; success: string | null }>();

  const isSubmitting = fetcher.state !== "idle";
  const actionError = fetcher.data?.error;
  const actionSuccess = fetcher.data?.success;

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ open: false, mode: "create" });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm());

  const ordersFetcher = useFetcher<{
    code: string;
    orders: PromoOrder[];
    error: string | null;
  }>();
  const [ordersModal, setOrdersModal] = useState<{
    open: boolean;
    promo?: PromoCode;
  }>({ open: false });

  const openOrders = (promo: PromoCode) => {
    setOrdersModal({ open: true, promo });
    ordersFetcher.load(`/promos/${promo.id}/orders`);
  };
  const closeOrders = () => setOrdersModal({ open: false });

  const loadingOrders = ordersFetcher.state !== "idle";

  const filtered = (promos as PromoCode[]).filter((p) =>
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(emptyForm());
    setModal({ open: true, mode: "create" });
  };

  const openEdit = (promo: PromoCode) => {
    setForm({
      code: promo.code,
      description: promo.description ?? "",
      discountPercent: String(promo.discountPercent),
      minOrderValue: String(promo.minOrderValue),
      maxDiscount: promo.maxDiscount != null ? String(promo.maxDiscount) : "",
      startDate: toLocalInput(promo.startDate),
      endDate: toLocalInput(promo.endDate),
      isActive: promo.isActive,
    });
    setModal({ open: true, mode: "edit", promo });
  };

  const closeModal = () => setModal({ open: false, mode: "create" });

  const setField = <K extends keyof PromoForm>(key: K, value: PromoForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isValid =
    form.code.trim().length >= 3 &&
    Number(form.discountPercent) >= 1 &&
    Number(form.discountPercent) <= 100 &&
    form.startDate &&
    form.endDate;

  const handleSave = () => {
    if (!isValid) return;
    const fd = new FormData();
    if (modal.mode === "create") {
      fd.append("intent", "create");
    } else {
      fd.append("intent", "update");
      fd.append("id", modal.promo!.id);
    }
    fd.append("code", form.code.trim().toUpperCase());
    fd.append("description", form.description.trim());
    fd.append("discountPercent", form.discountPercent);
    fd.append("minOrderValue", form.minOrderValue || "0");
    fd.append("maxDiscount", form.maxDiscount);
    fd.append("startDate", new Date(form.startDate).toISOString());
    fd.append("endDate", new Date(form.endDate).toISOString());
    fd.append("isActive", String(form.isActive));
    fetcher.submit(fd, { method: "post" });
    closeModal();
  };

  const handleDelete = (id: string) => {
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("id", id);
    fetcher.submit(fd, { method: "post" });
    setDeleteConfirm(null);
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors";

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-admin-danger font-medium">
          {loadError}
        </div>
      )}
      {actionError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-admin-danger font-medium">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
          {actionSuccess}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
          />
          <input
            type="text"
            placeholder="Search promo codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-admin-primary text-white rounded-lg text-sm font-semibold hover:bg-admin-primary-hover transition-colors"
        >
          <Plus size={18} />
          Add Promo Code
        </button>
      </div>

      {/* Table */}
      <div
        className={`bg-white rounded-xl border border-admin-border overflow-hidden transition-opacity ${isSubmitting ? "opacity-60" : ""}`}
      >
        {isSubmitting && (
          <div className="flex items-center justify-center py-4 border-b border-admin-border">
            <Loader2 size={20} className="animate-spin text-admin-primary mr-2" />
            <span className="text-sm text-admin-muted">Saving...</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Code
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Discount
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Min. Order
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Validity
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Orders
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {filtered.map((promo) => {
                const status = getStatus(promo);
                return (
                  <tr key={promo.id} className="hover:bg-admin-bg/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 font-mono tracking-wide">
                          {promo.code}
                        </span>
                        {promo.description && (
                          <span className="text-xs text-admin-muted line-clamp-1">
                            {promo.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">
                        {promo.discountPercent}% off
                      </span>
                      {promo.maxDiscount != null && (
                        <span className="block text-xs text-admin-muted">
                          up to ₹{promo.maxDiscount}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {promo.minOrderValue > 0 ? `₹${promo.minOrderValue}` : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-admin-muted whitespace-nowrap">
                        {formatDate(promo.startDate)} → {formatDate(promo.endDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {promo.orderCount && promo.orderCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => openOrders(promo)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-admin-primary/10 text-admin-primary text-sm font-semibold hover:bg-admin-primary/20 transition-colors"
                          title="View orders using this code"
                        >
                          <ShoppingCart size={14} />
                          {promo.orderCount}
                        </button>
                      ) : (
                        <span className="text-sm text-admin-muted">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(promo)}
                          className="p-1.5 rounded-md hover:bg-admin-bg text-admin-muted hover:text-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        {deleteConfirm === promo.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(promo.id)}
                              className="px-2.5 py-1 rounded-md bg-admin-danger text-white text-xs font-medium hover:bg-red-600 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2.5 py-1 rounded-md bg-admin-bg text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(promo.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-admin-muted hover:text-admin-danger transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !isSubmitting && (
          <div className="py-16 text-center">
            <Ticket size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-900">
              No promo codes found
            </p>
            <p className="text-sm text-admin-muted mt-1">
              {search
                ? "Try adjusting your search"
                : "Create your first promo code to boost conversions"}
            </p>
          </div>
        )}

        <div className="flex items-center px-6 py-4 border-t border-admin-border">
          <p className="text-sm text-admin-muted">
            <span className="font-medium text-slate-900">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "promo code" : "promo codes"}
          </p>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl border border-admin-border w-full max-w-lg mx-4 p-6 space-y-5 my-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {modal.mode === "create" ? "Add Promo Code" : "Edit Promo Code"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-md hover:bg-admin-bg text-admin-muted hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Code <span className="text-admin-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setField("code", e.target.value.toUpperCase())}
                    placeholder="SAVE10"
                    autoFocus
                    className={`${inputClass} font-mono tracking-wide`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Discount % <span className="text-admin-danger">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.discountPercent}
                    onChange={(e) => setField("discountPercent", e.target.value)}
                    placeholder="10"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="e.g. Festive season offer"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Min. Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderValue}
                    onChange={(e) => setField("minOrderValue", e.target.value)}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Max. Discount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscount}
                    onChange={(e) => setField("maxDiscount", e.target.value)}
                    placeholder="No cap"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Start Date <span className="text-admin-danger">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setField("startDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    End Date <span className="text-admin-danger">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setField("endDate", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="w-4 h-4 rounded border-admin-border text-admin-primary focus:ring-admin-primary/20"
                />
                <span className="text-sm font-medium text-slate-700">
                  Active (available for customers to use)
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 border border-admin-border rounded-lg text-sm font-medium text-slate-700 hover:bg-admin-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isValid}
                className="px-4 py-2.5 bg-admin-primary text-white rounded-lg text-sm font-semibold hover:bg-admin-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {modal.mode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {ordersModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
          <div className="absolute inset-0 bg-black/40" onClick={closeOrders} />
          <div className="relative bg-white rounded-xl shadow-xl border border-admin-border w-full max-w-2xl mx-4 my-auto">
            <div className="flex items-center justify-between p-6 border-b border-admin-border">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Orders</h2>
                <p className="text-sm text-admin-muted">
                  Placed with{" "}
                  <span className="font-mono font-bold text-slate-700">
                    {ordersModal.promo?.code}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeOrders}
                className="p-1.5 rounded-md hover:bg-admin-bg text-admin-muted hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={22} className="animate-spin text-admin-primary mr-2" />
                  <span className="text-sm text-admin-muted">Loading orders...</span>
                </div>
              ) : ordersFetcher.data?.error ? (
                <div className="px-6 py-10 text-center text-sm text-admin-danger font-medium">
                  {ordersFetcher.data.error}
                </div>
              ) : (ordersFetcher.data?.orders?.length ?? 0) === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingCart size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm font-semibold text-slate-900">No orders yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-admin-border">
                  {ordersFetcher.data?.orders.map((o) => (
                    <li key={o.id}>
                      <Link
                        to={`/orders/${o.id}`}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-admin-bg/40 transition-colors group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-admin-primary group-hover:underline">
                              #{o.id.slice(0, 8).toUpperCase()}
                            </span>
                            <ExternalLink
                              size={13}
                              className="text-admin-muted opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                          <p className="text-xs text-admin-muted truncate">
                            {o.customerName}
                            {o.email ? ` · ${o.email}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatAmount(o.totalAmount)}
                            </p>
                            {o.discountAmount > 0 && (
                              <p className="text-xs text-emerald-600 font-medium">
                                -{formatAmount(o.discountAmount)}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-admin-muted whitespace-nowrap">
                            {formatDate(o.createdAt)}
                          </span>
                          <ChevronRight size={16} className="text-admin-muted" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
