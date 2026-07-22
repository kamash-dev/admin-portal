import { fetchAPI } from "~/utils/apiConfig.server";
import type {
  Product,
  ProductVariant,
  Category,
  CreateProductInput,
  CreateProductResponse,
  CreateVariantInput,
  ProductStatus,
} from "~/types/product";

export async function getProducts(request: Request) {
  // Admin needs to see archived products too, so it can re-activate them.
  return fetchAPI<Product[]>(request, "products?includeArchived=true", {
    method: "GET",
  });
}

export async function updateProductStatus(
  request: Request,
  id: string,
  status: ProductStatus
) {
  return fetchAPI<{ success: boolean; message: string; product: Product }>(
    request,
    `products/${id}/status`,
    { method: "PATCH", body: { status } }
  );
}

export async function getCategories(request: Request) {
  return fetchAPI<Category[]>(request, "categories", { method: "GET" });
}

export async function createProduct(
  request: Request,
  data: CreateProductInput
) {
  return fetchAPI<CreateProductResponse>(request, "products/create", {
    method: "POST",
    body: data,
  });
}

export async function getProduct(request: Request, id: string) {
  const products = await fetchAPI<Product[]>(
    request,
    "products?includeArchived=true",
    { method: "GET" }
  );
  return products.find((p) => p.id === id) ?? null;
}

export async function updateProduct(
  request: Request,
  id: string,
  data: { name: string; description?: string | null; categoryId?: string | null, }
) {
  return fetchAPI<{ success: boolean; message: string; product: Product }>(
    request,
    `products/${id}`,
    { method: "PUT", body: data }
  );
}

export async function updateVariant(
  request: Request,
  variantId: string,
  data: Partial<Omit<ProductVariant, "id" | "productId">>
) {
  return fetchAPI<{ success: boolean; message: string; variant: ProductVariant }>(
    request,
    `products/variants/${variantId}`,
    { method: "PUT", body: data }
  );
}

export async function addVariantToProduct(
  request: Request,
  productId: string,
  data: Omit<CreateVariantInput, "images" | "tags"> & {
    images?: string[];
    tags?: string[];
  }
) {
  return fetchAPI<{ success: boolean; message: string; variant: ProductVariant }>(
    request,
    `products/${productId}/variants`,
    { method: "POST", body: data }
  );
}

export async function deleteVariant(request: Request, variantId: string) {
  return fetchAPI<{ success: boolean; message: string }>(
    request,
    `products/variants/${variantId}`,
    { method: "DELETE" }
  );
}
