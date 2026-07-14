import { useState } from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Tag,
  Layers,
  Upload,
  X,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { createProduct } from "~/services/product.server";
import { getCategories } from "~/services/category.server";
import type { Category, CreateVariantInput } from "~/types/product";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let categories: Category[] = [];
  try {
    categories = await getCategories(request);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }
  return { categories };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const payload = formData.get("payload") as string;
  console.log(payload, "payload");
  if (!payload) {
    return { error: "Invalid form data" };
  }

  try {
    const data = JSON.parse(payload);
    const response = await createProduct(request, data);

    if (response.error) {
      return { error: response.error };
    }

    return redirect("/products");
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
};

const emptyVariant: () => CreateVariantInput = () => ({
  title: "",
  size: "",
  color: "",
  price: 0,
  images: [],
  tags: [],
  inventory: 10,
});

export default function AddProduct() {
  const { categories } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const isSubmitting = fetcher.state !== "idle";
  const error = fetcher.data?.error;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [variants, setVariants] = useState<CreateVariantInput[]>([
    emptyVariant(),
  ]);
  const [variantImages, setVariantImages] = useState<string[][]>([[]]);
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([false]);
  const [tagInputs, setTagInputs] = useState<string[]>([""]);

  const addVariant = () => {
    setVariants([...variants, emptyVariant()]);
    setVariantImages([...variantImages, []]);
    setUploadingImages([...uploadingImages, false]);
    setTagInputs([...tagInputs, ""]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
    setVariantImages(variantImages.filter((_, i) => i !== index));
    setUploadingImages(uploadingImages.filter((_, i) => i !== index));
    setTagInputs(tagInputs.filter((_, i) => i !== index));
  };

  const updateVariant = (
    index: number,
    field: keyof CreateVariantInput,
    value: string | number
  ) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "jru89ggn");
    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dn80w6pu4/image/upload",
        { method: "POST", body: formData }
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

    setVariantImages((prev) => {
      const next = [...prev];
      next[variantIndex] = [...(next[variantIndex] || []), ...uploaded];
      return next;
    });

    setUploadingImages((prev) => {
      const next = [...prev];
      next[variantIndex] = false;
      return next;
    });
  };

  const removeImage = (variantIndex: number, imageIndex: number) => {
    setVariantImages((prev) => {
      const next = [...prev];
      next[variantIndex] = next[variantIndex].filter(
        (_, i) => i !== imageIndex
      );
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    console.log(variants, "variants");
    e.preventDefault();
    const finalVariants = variants.map((v, i) => ({
      ...v,
      images: variantImages[i] || [],
      tags: tagInputs[i]
        ? tagInputs[i]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        : [],
    }));

    const payload = {
      name,
      description: description || undefined,
      categoryId: categoryId || undefined,
      variants: finalVariants,
    };

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    console.log(formData, "formData");
    fetcher.submit(formData, {
      method: "post",
      action: "/products/new"
    })
  };

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
          <h1 className="text-xl font-bold text-slate-900">Add New Product</h1>
          <p className="text-sm text-admin-muted mt-0.5">
            Create a product with one or more variants
          </p>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-admin-danger font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Details */}
        <div className="bg-white rounded-xl border border-admin-border p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-admin-border">
            <Package size={18} className="text-admin-primary" />
            <h2 className="text-sm font-semibold text-slate-900">
              Product Details
            </h2>
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
                placeholder="e.g. Explorer Jumpsuit"
                className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief product description..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
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
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl border border-admin-border p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-admin-border">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-admin-primary" />
              <h2 className="text-sm font-semibold text-slate-900">
                Variants <span className="text-admin-danger">*</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-admin-primary hover:bg-admin-primary/5 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Variant
            </button>
          </div>

          <div className="space-y-6">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="relative border border-admin-border rounded-lg p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-admin-muted uppercase tracking-wider">
                    Variant {index + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-admin-muted hover:text-admin-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
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
                        updateVariant(index, "title", e.target.value)
                      }
                      placeholder="e.g. Red - 6M"
                      className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Size <span className="text-admin-muted">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) =>
                        updateVariant(index, "size", e.target.value)
                      }
                      placeholder="e.g. 6M"
                      className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Color <span className="text-admin-muted">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) =>
                        updateVariant(index, "color", e.target.value)
                      }
                      placeholder="e.g. Red"
                      className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
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
                        updateVariant(
                          index,
                          "price",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
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
                        updateVariant(
                          index,
                          "inventory",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
                    />
                  </div>

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

                    {/* Uploaded image previews */}
                    {variantImages[index]?.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-3">
                        {variantImages[index].map((url, imgIdx) => (
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

                    {/* Upload button */}
                    <label
                      className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploadingImages[index]
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
                      value={tagInputs[index]}
                      onChange={(e) => {
                        const updated = [...tagInputs];
                        updated[index] = e.target.value;
                        setTagInputs(updated);
                      }}
                      placeholder="summer, cotton, casual"
                      className="w-full px-4 py-2.5 bg-white border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to="/products"
            className="px-5 py-2.5 border border-admin-border rounded-lg text-sm font-medium text-slate-700 hover:bg-admin-bg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-admin-primary text-white rounded-lg text-sm font-semibold hover:bg-admin-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
