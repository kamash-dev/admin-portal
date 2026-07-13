import { fetchAPI } from "~/utils/apiConfig.server";
import type { CustomersResponse } from "~/types/customer";

export async function getCustomers(request: Request) {
  return fetchAPI<CustomersResponse>(request, "admin/customers", {
    method: "GET",
  });
}
