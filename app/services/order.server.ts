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

type OrderActionResponse = {
  success: boolean;
  message: string;
  status?: string;
};

// Maps a UI action to its backend endpoint segment
export const orderActionEndpoints = {
  accept: "accept",
  dispatch: "dispatch",
  deliver: "deliver",
  cancel: "cancel",
  return: "return",
} as const;

export type OrderAction = keyof typeof orderActionEndpoints;

export async function updateOrderStatus(
  request: Request,
  orderId: string,
  action: OrderAction
) {
  return fetchAPI<OrderActionResponse>(
    request,
    `orders/${orderId}/${orderActionEndpoints[action]}`,
    { method: "POST" }
  );
}

export async function acceptOrder(request: Request, orderId: string) {
  return updateOrderStatus(request, orderId, "accept");
}

export async function dispatchOrder(request: Request, orderId: string) {
  return updateOrderStatus(request, orderId, "dispatch");
}

export async function deliverOrder(request: Request, orderId: string) {
  return updateOrderStatus(request, orderId, "deliver");
}

export async function cancelOrder(request: Request, orderId: string) {
  return updateOrderStatus(request, orderId, "cancel");
}

export async function returnOrder(request: Request, orderId: string) {
  return updateOrderStatus(request, orderId, "return");
}

export async function getOrderDetails(request: Request, orderId: string) {
  return fetchAPI<OrderDetail>(request, `orders/admin/${orderId}`, {
    method: "GET",
  });
}
