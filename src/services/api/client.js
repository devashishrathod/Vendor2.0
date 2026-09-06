import { BASE_URL } from "../../config";

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
    throw new Error("Network Error");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}