import type { LoaderFunctionArgs } from "@remix-run/node";
import { getPromoOrders } from "~/services/promo.server";
import type { PromoOrder } from "~/types/promo";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const id = params.id as string;
  try {
    const data = await getPromoOrders(request, id);
    return { code: data.code, orders: data.orders ?? [], error: null };
  } catch (error) {
    return {
      code: "",
      orders: [] as PromoOrder[],
      error: error instanceof Error ? error.message : "Failed to load orders",
    };
  }
};
