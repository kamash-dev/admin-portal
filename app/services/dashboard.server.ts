import { fetchAPI } from "~/utils/apiConfig.server";

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

interface GetDashboardStatsParams {
  startDate?: string;
  endDate?: string;
}

export async function getDashboardStats(
  request: Request,
  params: GetDashboardStatsParams = {}
) {
  const query = new URLSearchParams();
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);

  const qs = query.toString();
  const url = `dashboard/stats${qs ? `?${qs}` : ""}`;

  return fetchAPI<DashboardStats>(request, url, { method: "GET" });
}
