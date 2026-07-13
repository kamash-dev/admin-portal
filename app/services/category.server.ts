import { fetchAPI } from "~/utils/apiConfig.server";
import type { Category } from "~/types/product";

export async function getCategories(request: Request) {
  return fetchAPI<Category[]>(request, "categories", { method: "GET" });
}

export async function createCategory(
  request: Request,
  data: { name: string; description?: string }
) {
  return fetchAPI<Category & { error?: string }>(request, "categories", {
    method: "POST",
    body: data,
  });
}

export async function updateCategory(
  request: Request,
  id: string,
  data: { name: string; description?: string }
) {
  return fetchAPI<Category & { error?: string }>(request, `categories/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deleteCategory(request: Request, id: string) {
  return fetchAPI<{ message?: string; error?: string }>(
    request,
    `categories/${id}`,
    { method: "DELETE" }
  );
}
