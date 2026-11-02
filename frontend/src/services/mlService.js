import { apiFetch } from "./api.js";

async function request(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await apiFetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || `ML API error: ${response.status}`);
  }

  return data;
}

export const getMLStatus = () =>
  request("/api/ml/status");

export const trainMLModel = () =>
  request("/api/ml/train", {
    method: "POST"
  });

export const getMLAnomalies = () =>
  request("/api/ml/anomalies");
