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
    throw new Error(data.detail || `Emergency API error: ${response.status}`);
  }

  return data;
}

export const getEmergencyIncidents = () =>
  request("/api/emergency/incidents");

export const getEmergencySummary = () =>
  request("/api/emergency/summary");

export const createEmergencyIncident = (incident) =>
  request("/api/emergency/incidents", {
    method: "POST",
    body: JSON.stringify(incident)
  });

export const updateEmergencyIncident = (id, changes) =>
  request(`/api/emergency/incidents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(changes)
  });
