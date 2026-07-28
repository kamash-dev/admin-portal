import { fetchAPI } from "~/utils/apiConfig.server";
import type {
  PromoCode,
  CreatePromoInput,
  UpdatePromoInput,
  PromoResponse,
  PromoOrdersResponse,
} from "~/types/promo";

export async function getPromoCodes(request: Request) {
  return fetchAPI<PromoCode[]>(request, "promo", { method: "GET" });
}

export async function getPromoOrders(request: Request, id: string) {
  return fetchAPI<PromoOrdersResponse>(request, `promo/${id}/orders`, {
    method: "GET",
  });
}

export async function createPromoCode(
  request: Request,
  data: CreatePromoInput
) {
  return fetchAPI<PromoResponse>(request, "promo", {
    method: "POST",
    body: data,
  });
}

export async function updatePromoCode(
  request: Request,
  id: string,
  data: UpdatePromoInput
) {
  return fetchAPI<PromoResponse>(request, `promo/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function deletePromoCode(request: Request, id: string) {
  return fetchAPI<{ message?: string; error?: string }>(
    request,
    `promo/${id}`,
    { method: "DELETE" }
  );
}
