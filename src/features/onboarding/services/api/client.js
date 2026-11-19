import { BASE_URL } from "../../../../config";
import { ApiError, reportSessionEnd, toApiError } from "@/services/http/apiError";

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

// ── Core request ──────────────────────────────────────────────────────────────
/**
 * Errors are thrown as ApiError (`status`, `details`, `code` = details.code).
 * A session-end error (401 / 403 with a session code) also logs out.
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
    if (!token) {
      const error = new ApiError("Session expired. Please log in again.", { status: 401, details: { code: "TOKEN_MISSING" } });
      reportSessionEnd(error);
      throw error;
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch {
    throw new ApiError("Network error. Please check your internet connection.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ApiError("Invalid response from server.", { status: res.status });
  }

  if (!res.ok) {
    // e.g. 429 → details.retryAfterSeconds (API doc #1 note 2).
    const error = toApiError(res.status, data, `Error ${res.status}: ${res.statusText}`);
    reportSessionEnd(error);
    throw error;
  }

  return data;
}
