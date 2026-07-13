import { useState, useMemo } from "react";
import { useLoaderData, useNavigation } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Search,
  Users,
  Mail,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { getCustomers } from "~/services/customer.server";
import type { Customer } from "~/types/customer";

const ITEMS_PER_PAGE = 10;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const response = await getCustomers(request);
    return {
      customers: response.data ?? [],
      totalCustomers: response.totalCustomers ?? 0,
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return {
      customers: [] as Customer[],
      totalCustomers: 0,
      error: error instanceof Error ? error.message : "Failed to load customers",
    };
  }
};

export default function Customers() {
  const { customers, totalCustomers, error } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return customers as Customer[];
    const q = search.toLowerCase();
    return (customers as Customer[]).filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-admin-danger font-medium">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
          />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className={`bg-white rounded-xl border border-admin-border overflow-hidden transition-opacity ${isLoading ? "opacity-60" : ""}`}>
        {isLoading && (
          <div className="flex items-center justify-center py-4 border-b border-admin-border">
            <Loader2 size={20} className="animate-spin text-admin-primary mr-2" />
            <span className="text-sm text-admin-muted">Loading customers...</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Orders
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {paginated.map((customer: Customer) => {
                const fullName = `${customer.firstName} ${customer.lastName}`;
                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-admin-bg/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900 font-medium">
                        {fullName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900 font-medium">
                        {customer.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-900 font-medium">
                        {customer._count?.orders ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-admin-muted">
                        {new Date(customer.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>                    
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <Users size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-900">
              No customers found
            </p>
            <p className="text-sm text-admin-muted mt-1">
              Try adjusting your search
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border">
          <p className="text-sm text-admin-muted">
            Showing{" "}
            <span className="font-medium text-slate-900">
              {paginated.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900">
              {totalCustomers}
            </span>{" "}
            customers
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
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
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      p === page
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
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
