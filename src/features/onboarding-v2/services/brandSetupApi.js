// Brand Outlet group (guide §4.12–§4.13): brand profile, listing features,
// outlets. Data goes through these APIs; the screen only moves with
// POST /brands/onboarding/continue | skip (onboardingApi.js). Never sends
// `isOnboarding`, `subCategoryId`, `showcaseSectionIds` or `currentScreen`.

import { getErrorStatus } from "@/services/http/apiError";
import { request, requestForm } from "@/features/onboarding/services/api/client";

/** List endpoints answer "nothing yet" with 404 (API doc "Empty list = 404"). */
async function listOrEmpty(call, pick) {
  try {
    return pick(await call());
  } catch (error) {
    if (getErrorStatus(error) === 404) return pick(null);
    throw error;
  }
}

// ── Brand profile (#32) ──────────────────────────────────────────────────────

/**
 * PUT /brands/update — logo / cover (files), description, email, and either
 * `mobile` or `useWhatsappAsMobile: true` (never both). Only the fields
 * passed are sent. Never moves the screen.
 * @param {{ description?: string, email?: string, mobile?: string, useWhatsappAsMobile?: boolean }} fields
 * @param {{ logo?: File|null, coverImage?: File|null }} [files]
 * @returns {Promise<{ data: object }>}
 */
export function updateBrandProfile(fields, { logo = null, coverImage = null } = {}) {
  const body = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
  if (!logo && !coverImage) return request("/brands/update", "PUT", body, true);
  const form = new FormData();
  Object.entries(body).forEach(([key, value]) => form.append(key, String(value)));
  if (logo) form.append("logo", logo);
  if (coverImage) form.append("coverImage", coverImage);
  return requestForm("/brands/update", "PUT", form);
}

// ── Listing features (#61–#65) ───────────────────────────────────────────────

/**
 * GET /brandFeatures/get-all — the brand's features, active and inactive.
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
export const getBrandFeatures = (brandId) =>
  listOrEmpty(
    () => request(`/brandFeatures/get-all?brandId=${encodeURIComponent(brandId)}&limit=100&sortBy=createdAt&sortOrder=asc`, "GET", null, true),
    (res) => res?.data?.data ?? [],
  );

/**
 * POST /brandFeatures/add (multipart; the icon is required). Over the active
 * limit → 400 FEATURE_LIMIT (`details.limit`).
 * @param {{ brandId: string, title: string, description?: string, icon: File }} feature
 */
export function addBrandFeature({ brandId, title, description, icon }) {
  const form = new FormData();
  form.append("brandId", brandId);
  form.append("title", title);
  if (description) form.append("description", description);
  form.append("icon", icon);
  return requestForm("/brandFeatures/add", "POST", form);
}

/** DELETE /brandFeatures/delete/:featureId (soft delete). @param {string} featureId */
export const deleteBrandFeature = (featureId) =>
  request(`/brandFeatures/delete/${encodeURIComponent(featureId)}`, "DELETE", null, true);

// ── Outlets (#34–#35, #34a, #34b) ────────────────────────────────────────────

/**
 * GET /subBrands/get-all — the brand's outlets with `verificationState`
 * (NEVER_VERIFIED | VERIFIED | REVERIFY) and `holdExpiresAt`.
 * @param {string} brandId
 * @returns {Promise<object[]>}
 */
export const getOutlets = (brandId) =>
  listOrEmpty(
    () => request(`/subBrands/get-all?brandId=${encodeURIComponent(brandId)}&limit=100&sortBy=createdAt&sortOrder=asc`, "GET", null, true),
    (res) => res?.data?.data ?? [],
  );

/**
 * POST /subBrands/signUp-with-whatsapp — a new outlet, or (same number again)
 * a fresh code for an unverified one (`isNewOutlet: false`). With
 * `useOwnerNumber` the server takes the owner's verified number and the outlet
 * is verified straight away (no code). Send `whatsappNumber` or
 * `useOwnerNumber`, never both.
 * @param {{ brandId: string, whatsappNumber?: string, useOwnerNumber?: boolean, outletType: 'OUTLET'|'FRANCHISE', isFirstOutlet?: boolean }} outlet
 */
export function signUpOutlet({ brandId, whatsappNumber, useOwnerNumber = false, outletType, isFirstOutlet = false }) {
  const body = { brandId, outletType, ...(isFirstOutlet ? { isFirstOutlet: true } : {}) };
  if (useOwnerNumber) body.useOwnerNumber = true;
  else body.whatsappNumber = whatsappNumber;
  return request("/subBrands/signUp-with-whatsapp", "POST", body, true);
}

/**
 * POST /auth/verify-otp-whatsapp as the outlet manager (role SUB_VENDOR).
 * The response's token is the manager's — it is never kept; the vendor's
 * session is untouched.
 * @param {{ whatsappNumber: string, otp: string }} input
 */
export const verifyOutletManagerOtp = ({ whatsappNumber, otp }) =>
  request("/auth/verify-otp-whatsapp", "POST", { whatsappNumber, otp, role: "SUB_VENDOR" }, false);

/** PATCH /subBrands/:id/whatsapp-number — fix a mistyped number (before verify). */
export const fixOutletNumber = (subBrandId, whatsappNumber) =>
  request(`/subBrands/${encodeURIComponent(subBrandId)}/whatsapp-number`, "PATCH", { whatsappNumber }, true);

/** PATCH /subBrands/:id/cancel — remove a never-verified outlet; its slot comes back. */
export const cancelOutlet = (subBrandId) => request(`/subBrands/${encodeURIComponent(subBrandId)}/cancel`, "PATCH", null, true);

/**
 * POST /locations/create for an outlet (`isSubBrandAddress: true`).
 * Coordinates are `[longitude, latitude]`. Empty fields are left out.
 * @param {object} payload
 */
export const createOutletLocation = (payload) => request("/locations/create", "POST", withoutEmpty(payload), true);

/**
 * PUT /locations/update/:id — the type flags are never re-sent (the server
 * refuses a type change).
 * @param {string} locationId @param {object} payload
 */
export function updateOutletLocation(locationId, payload) {
  const patch = withoutEmpty(payload);
  delete patch.subBrandId;
  delete patch.brandId;
  delete patch.isBrandAddress;
  delete patch.isSubBrandAddress;
  return request(`/locations/update/${encodeURIComponent(locationId)}`, "PUT", patch, true);
}

/** GET /locations/get/:id. @param {string} locationId */
export const getLocation = (locationId) => request(`/locations/get/${encodeURIComponent(locationId)}`, "GET", null, true);

/**
 * POST /workHours/upsert for one outlet — `{ subBrandId, monday … sunday }`,
 * each `{ isOpen, start, end }` (24-hour HH:mm, start before end).
 * @param {string} subBrandId @param {Record<string, { isOpen: boolean, start: string, end: string }>} hours
 */
export const upsertOutletHours = (subBrandId, hours) => request("/workHours/upsert", "POST", { subBrandId, ...hours }, true);

/** Drops null / undefined / blank-string fields (the server refuses empty ones). */
function withoutEmpty(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null && value !== undefined && !(typeof value === "string" && value.trim() === "")),
  );
}
