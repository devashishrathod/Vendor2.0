import { BASE_URL } from "../../../../config";

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

// ── Core request ──────────────────────────────────────────────────────────────
/**
 * @param {string}  endpoint      - e.g. '/auth/loginOrSignUp-with-whatsapp'
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
 * @param {object}  body          - JSON body (optional)
 * @param {boolean} requiresAuth  - attach Bearer token if true
 */
export async function request(
  endpoint,
  method = "GET",
  body = null,
  requiresAuth = false,
) {
  const headers = { "Content-Type": "application/json" };

  if (requiresAuth) {
    const token = getToken();
    if (!token) throw new Error("Session expired. Please log in again.");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch {
    throw new Error("Network error. Please check your internet connection.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid response from server.");
  }

  if (!res.ok) {
    throw new Error(
      data?.message || data?.error || `Error ${res.status}: ${res.statusText}`,
    );
  }

  return data;
}
