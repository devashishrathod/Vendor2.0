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
