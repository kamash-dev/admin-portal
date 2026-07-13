import { fetchAPI } from "~/utils/apiConfig.server";
import type { OrdersResponse, OrderDetail } from "~/types/order";

interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function getAdminOrders(
  request: Request,
  params: GetOrdersParams = {}
) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);

  const qs = query.toString();
  const url = `orders/admin${qs ? `?${qs}` : ""}`;

  return fetchAPI<OrdersResponse>(request, url, { method: "GET" });
}

export async function cancelOrder(request: Request, orderId: string) {
  return fetchAPI<{ success: boolean; message: string }>(
    request,
    `orders/${orderId}/cancel`,
    { method: "POST" }
  );
}

export async function returnOrder(request: Request, orderId: string) {
  return fetchAPI<{ success: boolean; message: string }>(
    request,
    `orders/${orderId}/return`,
    { method: "POST" }
  );
}

export async function getOrderDetails(request: Request, orderId: string) {
  return fetchAPI<OrderDetail>(request, `orders/admin/${orderId}`, {
    method: "GET",
  });
}
