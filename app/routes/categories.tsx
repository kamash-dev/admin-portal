import { useState } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  Plus,
  Search,
  FolderOpen,
  Edit,
  Trash2,
  X,
  Loader2,
  Package,
} from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "~/services/category.server";
import type { Category } from "~/types/product";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const categories = await getCategories(request);
    return { categories: categories ?? [], error: null };
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return {
      categories: [] as Category[],
      error:
        error instanceof Error ? error.message : "Failed to load categories",
    };
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "create") {
      const name = formData.get("name") as string;
      const description = (formData.get("description") as string) || undefined;
      const result = await createCategory(request, { name, description });
      if (result.error) return { error: result.error };
      return { success: "Category created successfully" };
    }

    if (intent === "update") {
      const id = formData.get("id") as string;
      const name = formData.get("name") as string;
      const description = (formData.get("description") as string) || undefined;
      const result = await updateCategory(request, id, { name, description });
      if (result.error) return { error: result.error };
      return { success: "Category updated successfully" };
    }

    if (intent === "delete") {
      const id = formData.get("id") as string;
      const result = await deleteCategory(request, id);
      if (result.error) return { error: result.error };
      return { success: "Category deleted successfully" };
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
  category?: Category;
}

export default function Categories() {
  const { categories, error: loadError } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ error: string | null; success: string | null }>();

  const isSubmitting = fetcher.state !== "idle";
  const actionError = fetcher.data?.error;
  const actionSuccess = fetcher.data?.success;

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const filtered = (categories as Category[]).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setFormName("");
    setFormDescription("");
    setModal({ open: true, mode: "create" });
  };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormDescription(cat.description ?? "");
    setModal({ open: true, mode: "edit", category: cat });
  };

  const closeModal = () => {
    setModal({ open: false, mode: "create" });
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    const formData = new FormData();
    if (modal.mode === "create") {
      formData.append("intent", "create");
    } else {
      formData.append("intent", "update");
      formData.append("id", modal.category!.id);
    }
    formData.append("name", formName.trim());
    formData.append("description", formDescription.trim());
    fetcher.submit(formData, { method: "post" });
    closeModal();
  };

  const handleDelete = (id: string) => {
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("id", id);
    fetcher.submit(formData, { method: "post" });
    setDeleteConfirm(null);
  };

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
            placeholder="Search categories..."
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
          Add Category
        </button>
      </div>

      {/* Table */}
      <div
        className={`bg-white rounded-xl border border-admin-border overflow-hidden transition-opacity ${isSubmitting ? "opacity-60" : ""}`}
      >
        {isSubmitting && (
          <div className="flex items-center justify-center py-4 border-b border-admin-border">
            <Loader2
              size={20}
              className="animate-spin text-admin-primary mr-2"
            />
            <span className="text-sm text-admin-muted">
              {isSubmitting ? "Saving..." : "Loading categories..."}
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border bg-admin-bg/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Description
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Products
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {filtered.map((cat: Category) => (
                <tr
                  key={cat.id}
                  className="hover:bg-admin-bg/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-admin-muted">
                      {cat.description || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                      {cat._count?.products ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-md hover:bg-admin-bg text-admin-muted hover:text-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>

                      {deleteConfirm === cat.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id)}
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
                          onClick={() => setDeleteConfirm(cat.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-admin-muted hover:text-admin-danger transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !isSubmitting && (
          <div className="py-16 text-center">
            <FolderOpen size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-900">
              No categories found
            </p>
            <p className="text-sm text-admin-muted mt-1">
              {search
                ? "Try adjusting your search"
                : "Create your first category to get started"}
            </p>
          </div>
        )}

        <div className="flex items-center px-6 py-4 border-t border-admin-border">
          <p className="text-sm text-admin-muted">
            <span className="font-medium text-slate-900">
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "category" : "categories"}
          </p>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-admin-border w-full max-w-md mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {modal.mode === "create"
                  ? "Add Category"
                  : "Edit Category"}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name <span className="text-admin-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Infants, Boys, Girls"
                  autoFocus
                  className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors resize-none"
                />
              </div>
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
                disabled={!formName.trim()}
                className="px-4 py-2.5 bg-admin-primary text-white rounded-lg text-sm font-semibold hover:bg-admin-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {modal.mode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
