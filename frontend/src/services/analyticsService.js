import { apiFetch } from "./api.js";

export async function getAnalyticsOverview(startDate = "", endDate = "") {
  const params = new URLSearchParams();

  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  const query = params.toString();
  const endpoint = `/api/analytics/overview${query ? `?${query}` : ""}`;

  const response = await apiFetch(endpoint);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.detail || `Analytics request failed: ${response.status}`);
  }

  return result;
}
