import { API_BASE_URL as API_URL } from "./api.js";
export async function registerUser(data) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || "Registration failed");
  return result;
}

export async function loginUser(data) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || "Login failed");
  return result;
}

export async function getMyProfile(token) {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || "Session expired");
  return result.user;
}
