import { useState, useMemo } from "react";
import { useLoaderData, useNavigation, Link } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { getProducts } from "~/services/product.server";
import type { Product } from "~/types/product";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/popover";

const ITEMS_PER_PAGE = 10;

function getLowestPrice(product: Product): number {
  if (!product.variants || product.variants.length === 0) return 0;
  return Math.min(...product.variants.map((v) => v.price));
}

function getTotalStock(product: Product): number {
  if (!product.variants || product.variants.length === 0) return 0;
  return product.variants.reduce((sum, v) => sum + v.inventory, 0);
}

function getProductStatus(product: Product): "Active" | "Draft" | "Archived" {
  const stock = getTotalStock(product);
  if (!product.variants || product.variants.length === 0) return "Draft";
  if (stock === 0) return "Archived";
  return "Active";
}

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Draft: "bg-amber-50 text-amber-700",
  Archived: "bg-slate-100 text-slate-600",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const products = await getProducts(request);
    return { products: products ?? [], error: null };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return {
      products: [] as Product[],
      error: error instanceof Error ? error.message : "Failed to load products",
    };
  }
};

export default function Products() {
  const { products, error } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return (products as Product[]).filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const status = getProductStatus(p);
      const matchStatus = filterStatus === "All" || status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [products, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedProducts = filtered.slice(
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

  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
            />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-admin-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none"
            />
          </div>
        </div>

        <Link
          to="/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-admin-primary text-white rounded-lg text-sm font-semibold hover:bg-admin-primary-hover transition-colors"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Products Table */}
      <div className={`bg-white rounded-xl border border-admin-border overflow-hidden transition-opacity ${isLoading ? "opacity-60" : ""}`}>
        {isLoading && (
          <div className="flex items-center justify-center py-4 border-b border-admin-border">
            <Loader2 size={20} className="animate-spin text-admin-primary mr-2" />
            <span className="text-sm text-admin-muted">Loading products...</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Product Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Variants
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Stock
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {paginatedProducts.map((product: Product) => {
                const lowestPrice = getLowestPrice(product);
                const totalStock = getTotalStock(product);
                const status = getProductStatus(product);
                const thumbnail =
                  product.variants?.[0]?.images?.[0] ?? null;

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-admin-bg/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900 block">
                        {product.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {product.category?.name ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {lowestPrice.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {product.variants?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${totalStock === 0 ? "text-admin-danger" : totalStock < 20 ? "text-admin-warning" : "text-slate-900"}`}
                      >
                        {totalStock === 0 ? "Out of stock" : totalStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 relative">
                        <button
                          onClick={() =>
                            setMenuOpen(
                              menuOpen === product.id ? null : product.id
                            )
                          }
                          className="p-1.5 rounded-md hover:bg-admin-bg text-admin-muted hover:text-slate-700 transition-colors"
                        >
                          <Popover>
                            <PopoverTrigger>
                              <MoreHorizontal size={18} />
                            </PopoverTrigger>
                            <PopoverContent className="bg-white border border-admin-border rounded-lg shadow-lg w-fit mr-7">
                              <Link to={`/products/${product.id}/edit`} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-admin-bg transition-colors">
                                <Eye size={14} />
                                View
                              </Link>
                              <div className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-admin-bg transition-colors">
                                <Trash2 size={14} />
                                Delete
                              </div>
                            </PopoverContent>
                          </Popover>
                        </button>
                        {/* {menuOpen === product.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpen(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-admin-border py-1 z-20">
                              <Link
                                to={`/products/${product.id}/edit`}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-admin-bg transition-colors"
                                onClick={() => setMenuOpen(null)}
                              >
                                <Eye size={14} />
                                View
                              </Link>
                              <Link
                                to={`/products/${product.id}/edit`}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-admin-bg transition-colors"
                                onClick={() => setMenuOpen(null)}
                              >
                                <Edit size={14} />
                                Edit
                              </Link>
                              <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-admin-danger hover:bg-red-50 transition-colors">
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </>
                        )} */}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedProducts.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <Package size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-900">
              No products found
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
              {paginatedProducts.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-900">
              {filtered.length}
            </span>{" "}
            products
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
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${p === page
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
