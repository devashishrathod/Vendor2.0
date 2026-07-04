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

    console.log("RAW:", raw);

    const parsed = JSON.parse(raw);

    console.log("PARSED:", parsed);

    console.log("BrandId:", parsed?.state?.formData?.brandId);

    return parsed?.state?.formData?.brandId || null;
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