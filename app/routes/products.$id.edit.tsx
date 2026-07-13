import { useEffect, useState } from "react";
import { useLoaderData, useFetcher, Link, useRevalidator } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Package,
  Tag,
  Layers,
  Upload,
  X,
  Loader2,
  ImageIcon,
  Check,
} from "lucide-react";
import {
  getProduct,
  updateProduct,
  updateVariant,
  addVariantToProduct,
  deleteVariant,
} from "~/services/product.server";
import { getCategories } from "~/services/category.server";
import type { Category, ProductVariant } from "~/types/product";
import { toast } from "sonner";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!id) throw new Response("Product ID is required", { status: 400 });

  let categories: Category[] = [];
  try {
    categories = await getCategories(request);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }

  const product = await getProduct(request, id);
  if (!product) throw new Response("Product not found", { status: 404 });

  return { product, categories };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params;
  if (!id) return { error: "Product ID is required" };

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  try {
    if (intent === "updateProduct") {
      const payload = JSON.parse(formData.get("payload") as string);
      const res = await updateProduct(request, id, payload);
      return { success: "Product details updated" };
    }

    if (intent === "updateVariant") {
      const variantId = formData.get("variantId") as string;
      const payload = JSON.parse(formData.get("payload") as string);
      const res = await updateVariant(request, variantId, payload);
      return { success: `Variant updated` };
    }

    if (intent === "addVariant") {
      const payload = JSON.parse(formData.get("payload") as string);
      await addVariantToProduct(request, id, payload);
      return { success: "New variant added" };
    }

    if (intent === "deleteVariant") {
      const variantId = formData.get("variantId") as string;
      await deleteVariant(request, variantId);
      return { success: "Variant deleted" };
    }

    if (intent === "done") {
      return redirect("/products");
    }

    return { error: "Unknown intent" };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
};

interface VariantFormState {
  id: string;
  title: string;
  size: string;
  color: string;
  price: number;
  images: string[];
  tags: string;
  inventory: number;
}

function variantToFormState(v: ProductVariant): VariantFormState {
  return {
    id: v.id,
    title: v.title,
    size: v.size,
    color: v.color,
    price: v.price,
    images: v.images ?? [],
    tags: (v.tags ?? []).join(", "),
    inventory: v.inventory,
  };
}

const emptyNewVariant = () => ({
  title: "",
  size: "",
  color: "",
  price: 0,
  images: [] as string[],
  tags: "",
  inventory: 10,
});

type NewVariantForm = ReturnType<typeof emptyNewVariant>;

export default function EditProduct() {
  const { product, categories } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();

  const isBusy = fetcher.state !== "idle";
  const actionError = (fetcher.data as { error?: string })?.error;
  const actionSuccess = (fetcher.data as { success?: string })?.success;

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");

  const [variants, setVariants] = useState<VariantFormState[]>(
    (product.variants as ProductVariant[]).map(variantToFormState)
  );
  const [uploadingImages, setUploadingImages] = useState<boolean[]>(
    product.variants.map(() => false)
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariant, setNewVariant] = useState<NewVariantForm>(emptyNewVariant());
  const [newVariantUploading, setNewVariantUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setVariants((product.variants as ProductVariant[]).map(variantToFormState));
    setUploadingImages(product.variants.map(() => false));
  }, [product.variants]);

  const updateVariantField = (
    index: number,
    field: keyof VariantFormState,
    value: string | number | string[]
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", "jru89ggn");
    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dn80w6pu4/image/upload",
        { method: "POST", body: fd }
      );
      const data = await res.json();
      return data.secure_url ?? data.url ?? null;
    } catch {
      return null;
    }
  };

  const handleImageSelect = async (
    variantIndex: number,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds 2 MB and was skipped.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        alert(`"${file.name}" is not an image and was skipped.`);
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;

    setUploadingImages((prev) => {
      const next = [...prev];
      next[variantIndex] = true;
      return next;
    });

    const urls = await Promise.all(validFiles.map(uploadToCloudinary));
    const uploaded = urls.filter((u): u is string => u !== null);

    if (uploaded.length < validFiles.length) {
      alert(
        `${validFiles.length - uploaded.length} image(s) failed to upload.`
      );
    }

    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex ? { ...v, images: [...v.images, ...uploaded] } : v
      )
    );

    setUploadingImages((prev) => {
      const next = [...prev];
      next[variantIndex] = false;
      return next;
    });
  };

  const removeImage = (variantIndex: number, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? { ...v, images: v.images.filter((_, j) => j !== imageIndex) }
          : v
      )
    );
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("intent", "updateProduct");
    fd.append(
      "payload",
      JSON.stringify({
        name,
        description: description || null,
        categoryId: categoryId || null,
      })
    );
    fetcher.submit(fd, { method: "post"});
  };

  const handleSaveVariant = (e: React.FormEvent<HTMLFormElement>, index: number) => {
    e.preventDefault();
    const v = variants[index];
    const fd = new FormData();
    fd.append("intent", "updateVariant");
    fd.append("variantId", v.id);
    fd.append(
      "payload",
      JSON.stringify({
        title: v.title,
        size: v.size,
        color: v.color,
        price: v.price,
        images: v.images,
        tags: v.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        inventory: v.inventory,
      })
    );
    fetcher.submit(fd, { method: "post" });
  };

  const handleAddVariant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("intent", "addVariant");
    fd.append(
      "payload",
      JSON.stringify({
        title: newVariant.title,
        size: newVariant.size,
        color: newVariant.color,
        price: newVariant.price,
        images: newVariant.images,
        tags: newVariant.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        inventory: newVariant.inventory,
      })
    );
    fetcher.submit(fd, { method: "post" });
  };

  const handleDeleteVariant = (variantId: string) => {
    const fd = new FormData();
    fd.append("intent", "deleteVariant");
    fd.append("variantId", variantId);
    fetcher.submit(fd, { method: "post" });
    setDeleteConfirm(null);
  };

  const handleNewVariantImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds 2 MB and was skipped.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        alert(`"${file.name}" is not an image and was skipped.`);
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;

    setNewVariantUploading(true);
    const urls = await Promise.all(validFiles.map(uploadToCloudinary));
    const uploaded = urls.filter((u): u is string => u !== null);

    if (uploaded.length < validFiles.length) {
      alert(
        `${validFiles.length - uploaded.length} image(s) failed to upload.`
      );
    }

    setNewVariant((prev) => ({
      ...prev,
      images: [...prev.images, ...uploaded],
    }));
    setNewVariantUploading(false);
  };

  const removeNewVariantImage = (imageIndex: number) => {
    setNewVariant((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== imageIndex),
    }));
  };

  useEffect(() => {
    if (actionSuccess) {
      toast.success(actionSuccess);
      if (actionSuccess === "New variant added") {
        setNewVariant(emptyNewVariant());
        setShowAddForm(false);
      }
      revalidator.revalidate();
    }
  }, [actionSuccess]);

  const inputCls =
    "w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/products"
          className="p-2 rounded-lg hover:bg-admin-bg text-admin-muted hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Edit Product</h1>
          <p className="text-sm text-admin-muted mt-0.5">
            Update product details and variants individually
          </p>
        </div>
      </div>

      {actionError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-admin-danger font-medium">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium">
          <Check size={16} />
          {actionSuccess}
        </div>
      )}

      {/* Product Details */}
      <form onSubmit={handleSaveProduct} className="bg-white rounded-xl border border-admin-border p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-admin-border">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-admin-primary" />
            <h2 className="text-sm font-semibold text-slate-900">
              Product Details
            </h2>
          </div>
          <button
            type="submit"
            disabled={isBusy}
            className="flex items-center gap-1.5 px-4 py-2 bg-admin-primary text-white rounded-lg text-sm font-semibold hover:bg-admin-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isBusy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save Details
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Product Name <span className="text-admin-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">No category</option>
              {(categories as Category[]).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Variants */}
      <div className="bg-white rounded-xl border border-admin-border p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-admin-border">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-admin-primary" />
            <h2 className="text-sm font-semibold text-slate-900">Variants</h2>
            <span className="text-xs text-admin-muted ml-1">
              ({variants.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-admin-primary hover:bg-admin-primary/5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Variant
          </button>
        </div>

        <div className="space-y-6">
          {variants.map((variant, index) => (
            <form
              onSubmit={(e) => handleSaveVariant(e, index)}
              key={variant.id}
              className="relative border border-admin-border rounded-lg p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider">
                  Variant {index + 1}
                  <span className="ml-2 font-mono text-[10px] text-slate-400 normal-case">
                    {variant.id.slice(0, 8)}...
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  {deleteConfirm === variant.id ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-xs text-admin-danger font-medium">
                        Delete this variant?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(variant.id)}
                        disabled={isBusy}
                        className="px-2 py-1 bg-admin-danger text-white rounded text-xs font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 bg-white border border-admin-border text-slate-700 rounded text-xs font-medium hover:bg-admin-bg transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(variant.id)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 p-2 rounded-lg text-admin-muted hover:text-admin-danger hover:bg-red-50 disabled:opacity-60 transition-colors"
                      title="Delete variant"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="flex items-center gap-1.5 px-4 py-2 bg-admin-primary text-white rounded-lg text-sm font-semibold hover:bg-admin-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBusy ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Save Variant
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Title <span className="text-admin-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={variant.title}
                    onChange={(e) =>
                      updateVariantField(index, "title", e.target.value)
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Size <span className="text-admin-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={variant.size}
                    onChange={(e) =>
                      updateVariantField(index, "size", e.target.value)
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Color <span className="text-admin-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={variant.color}
                    onChange={(e) =>
                      updateVariantField(index, "color", e.target.value)
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Price <span className="text-admin-danger">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={variant.price || ""}
                    onChange={(e) =>
                      updateVariantField(
                        index,
                        "price",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Inventory
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={variant.inventory}
                    onChange={(e) =>
                      updateVariantField(
                        index,
                        "inventory",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={inputCls}
                  />
                </div>

                {/* Images */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1">
                      <ImageIcon size={12} />
                      Images
                      <span className="text-xs text-admin-muted font-normal">
                        (max 2 MB each)
                      </span>
                    </span>
                  </label>

                  {variant.images.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {variant.images.map((url, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative group w-20 h-20 rounded-lg overflow-hidden border border-admin-border"
                        >
                          <img
                            src={url}
                            alt={`Variant ${index + 1} image ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index, imgIdx)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingImages[index]
                      ? "border-admin-primary/40 bg-admin-primary/5 cursor-wait"
                      : "border-admin-border hover:border-admin-primary/40 hover:bg-admin-primary/5"
                      }`}
                  >
                    {uploadingImages[index] ? (
                      <>
                        <Loader2
                          size={16}
                          className="text-admin-primary animate-spin"
                        />
                        <span className="text-sm text-admin-primary font-medium">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="text-admin-muted" />
                        <span className="text-sm text-admin-muted">
                          Click to select images
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploadingImages[index]}
                      className="hidden"
                      onChange={(e) => {
                        handleImageSelect(index, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {/* Tags */}
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      Tags
                      <span className="text-xs text-admin-muted font-normal">
                        (comma-separated)
                      </span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={variant.tags}
                    onChange={(e) =>
                      updateVariantField(index, "tags", e.target.value)
                    }
                    placeholder="summer, cotton, casual"
                    className={inputCls}
                  />
                </div>
              </div>
            </form>
          ))}
        </div>

        {/* Add New Variant Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddVariant}
            className="border-2 border-dashed border-admin-primary/30 rounded-lg p-5 space-y-4 bg-admin-primary/[0.02]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-admin-primary uppercase tracking-wider">
                New Variant
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewVariant(emptyNewVariant());
                  }}
                  className="px-3 py-1.5 border border-admin-border rounded-lg text-xs font-medium text-slate-700 hover:bg-admin-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBusy || !newVariant.title || !newVariant.price}
                  className="flex items-center gap-1.5 px-4 py-2 bg-admin-primary text-white rounded-lg text-xs font-semibold hover:bg-admin-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isBusy ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={12} />
                  )}
                  Add Variant
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-admin-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newVariant.title}
                  onChange={(e) =>
                    setNewVariant((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. Blue - 12M"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Size
                </label>
                <input
                  type="text"
                  value={newVariant.size}
                  onChange={(e) =>
                    setNewVariant((p) => ({ ...p, size: e.target.value }))
                  }
                  placeholder="e.g. 12M"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Color
                </label>
                <input
                  type="text"
                  value={newVariant.color}
                  onChange={(e) =>
                    setNewVariant((p) => ({ ...p, color: e.target.value }))
                  }
                  placeholder="e.g. Blue"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Price <span className="text-admin-danger">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newVariant.price || ""}
                  onChange={(e) =>
                    setNewVariant((p) => ({
                      ...p,
                      price: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Inventory
                </label>
                <input
                  type="number"
                  min={0}
                  value={newVariant.inventory}
                  onChange={(e) =>
                    setNewVariant((p) => ({
                      ...p,
                      inventory: parseInt(e.target.value) || 0,
                    }))
                  }
                  className={inputCls}
                />
              </div>

              {/* New variant images */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <ImageIcon size={12} />
                    Images
                    <span className="text-xs text-admin-muted font-normal">
                      (max 2 MB each)
                    </span>
                  </span>
                </label>

                {newVariant.images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {newVariant.images.map((url, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="relative group w-20 h-20 rounded-lg overflow-hidden border border-admin-border"
                      >
                        <img
                          src={url}
                          alt={`New variant image ${imgIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewVariantImage(imgIdx)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    newVariantUploading
                      ? "border-admin-primary/40 bg-admin-primary/5 cursor-wait"
                      : "border-admin-border hover:border-admin-primary/40 hover:bg-admin-primary/5"
                  }`}
                >
                  {newVariantUploading ? (
                    <>
                      <Loader2
                        size={16}
                        className="text-admin-primary animate-spin"
                      />
                      <span className="text-sm text-admin-primary font-medium">
                        Uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="text-admin-muted" />
                      <span className="text-sm text-admin-muted">
                        Click to select images
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={newVariantUploading}
                    className="hidden"
                    onChange={(e) => {
                      handleNewVariantImageSelect(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {/* New variant tags */}
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    Tags
                    <span className="text-xs text-admin-muted font-normal">
                      (comma-separated)
                    </span>
                  </span>
                </label>
                <input
                  type="text"
                  value={newVariant.tags}
                  onChange={(e) =>
                    setNewVariant((p) => ({ ...p, tags: e.target.value }))
                  }
                  placeholder="summer, cotton, casual"
                  className={inputCls}
                />
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Link
          to="/products"
          className="px-5 py-2.5 border border-admin-border rounded-lg text-sm font-medium text-slate-700 hover:bg-admin-bg transition-colors"
        >
          Back to Products
        </Link>
      </div>
    </div>
  );
}
