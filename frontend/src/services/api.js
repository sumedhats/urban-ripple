const DEFAULT_API_URL = "http:" + "//127.0.0.1:8000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  DEFAULT_API_URL
).replace(/\/+$/, "");

export function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("urban_ripple_token");
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", "Bearer " + token);
  }

  return fetch(API_BASE_URL + endpoint, {
    ...options,
    headers
  });
}
