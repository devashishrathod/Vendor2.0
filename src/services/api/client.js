import { BASE_URL } from "../../config";
import { ApiError, reportSessionEnd, toApiError } from "../http/apiError";

// ───────────────────────────────────────────────
// Token
// ───────────────────────────────────────────────

export const getToken = () => localStorage.getItem("token");

export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const clearToken = () => {
  localStorage.removeItem("token");
};

// ───────────────────────────────────────────────
// Brand Id
// ───────────────────────────────────────────────

export const getBrandId = () => {
  try {
    const raw = localStorage.getItem("onboarding-store");
    const parsed = JSON.parse(raw);
    const onboardingBrandId = parsed?.state?.formData?.brandId || null;
    if (onboardingBrandId) return onboardingBrandId;

    // Falls back to the auth session's own brandId (persisted under
    // "auth-storage", see authStore.js's partialize) — the onboarding-store
    // value is only ever populated during the onboarding flow itself, so
    // it's empty/stale for a vendor who's long past onboarding and just
    // logged back in on a fresh session or a different device, even though
    // they have a real brand. Without this fallback, every brand-dependent
    // fetch (useBrand, and anything downstream of it) silently never fires.
    const authRaw = localStorage.getItem("auth-storage");
    const authParsed = JSON.parse(authRaw);
    return authParsed?.state?.user?.brandId || null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

// ───────────────────────────────────────────────
// Request
// ───────────────────────────────────────────────

export async function request(
  endpoint,
  method = "GET",
  body = null,
  requiresAuth = false
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = getToken();

    if (!token) {
      throw new Error("Session expired");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch {
    throw new ApiError("Network Error");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("Invalid response from server.", { status: response.status });
  }

  if (!response.ok) {
    const error = toApiError(response.status, data, "Something went wrong");
    reportSessionEnd(error);
    throw error;
  }

  return data;
}