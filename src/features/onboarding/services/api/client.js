import { BASE_URL } from "../../../../config";
import { ApiError, reportSessionEnd, toApiError } from "@/services/http/apiError";

// ── Token helpers ─────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

/** Bearer header, or a session-end error when there is no token. */
function authHeader() {
  const token = getToken();
  if (!token) {
    const error = new ApiError("Session expired. Please log in again.", { status: 401, details: { code: "TOKEN_MISSING" } });
    reportSessionEnd(error);
    throw error;
  }
  return { Authorization: `Bearer ${token}` };
}

/** Runs the fetch and turns every failure into an ApiError. */
async function send(endpoint, config) {
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
    // e.g. 413: the platform can cut an over-size upload off without a JSON body.
    if (!res.ok) {
      const error = toApiError(res.status, null, `Error ${res.status}: ${res.statusText}`);
      reportSessionEnd(error);
      throw error;
    }
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
  const headers = { "Content-Type": "application/json", ...(requiresAuth ? authHeader() : {}) };
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);
  return send(endpoint, config);
}

/**
 * Multipart request (file uploads). Always authenticated; the browser sets
 * the multipart Content-Type boundary itself.
 * @param {string} endpoint
 * @param {'POST'|'PUT'} method
 * @param {FormData} formData
 */
export async function requestForm(endpoint, method, formData) {
  return send(endpoint, { method, headers: authHeader(), body: formData });
}
