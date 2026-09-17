// ─────────────────────────────────────────────────────────────────────────────
// services/api/subscription.api.js
// All subscription plan related API calls
// ─────────────────────────────────────────────────────────────────────────────

import { request } from "../../../services/api/client";

// Pulls the innermost "data" out of whatever shape `request()` returns.
//   getAll     -> { success, message, data: { total, ..., data: [...] } }
//   getPlanById -> { success, message, data: { _id, name, ... } }
// In both cases this resolves to `res.data.data` when present.
function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

function normalizePlan(p) {
  if (!p || !p._id) return null;
  return {
    id: p._id,
    name: p.name,
    label: p.name,
    description: p.description,
    price: p.price,
    type: p.type, // "MONTHLY" | "YEARLY"
    durationInDays: p.durationInDays,
    benefits: p.benefits || [],
    limitations: p.limitations || [],
    features: p.features || [],
    isActive: p.isActive,
    createdAt: p.createdAt,
  };
}

/**
 * Get paginated list of subscription plans
 * GET /subscriptions/getAll?page=&limit=
 *
 * Response shape:
 * {
 *   success: true,
 *   message: "Subscriptions fetched",
 *   data: {
 *     total, totalPages, page, limit,
 *     data: [{ _id, name, description, price, type, durationInDays,
 *              benefits, limitations, features, isActive, createdAt }]
 *   }
 * }
 *
 * @param {number} page
 * @param {number} limit
 * @example
 * const { data } = await subscriptionAPI.getAll(1, 10);
 */
export const getAll = (page = 1, limit = 10) =>
  request(`/subscriptions/getAll?page=${page}&limit=${limit}`, "GET", null, true);

/**
 * Get a single subscription plan by id, normalized to the same shape used
 * across PlanInfo / OrderSummary / PlanPriceCard.
 * GET /subscriptions/get/:id
 *
 * @param {string} id
 * @returns {Promise<object>} normalized plan object
 * @example
 * const plan = await subscriptionAPI.getPlanById("6a6ced4fe43ba4979a3725fe");
 */
export const getPlanById = async (id) => {
  const res = await request(`/subscriptions/get/${id}`, "GET", null, true);
  const plan = normalizePlan(unwrap(res));

  if (!plan) {
    throw new Error("Plan not found");
  }

  return plan;
};

/**
 * Get the full checkout preview for a subscription plan — pricing/GST
 * breakdown, ready-to-render order summary rows, billing details, the
 * validity window, and whether the brand can even proceed — all computed
 * server-side so the checkout page doesn't need to recompute any of it.
 * POST /transactions/subscribe/preview
 * body: { subscriptionId }
 *
 * Response shape (data): { brand, plan, action, currentPlan, validity,
 *   billingDetails, pricing, orderSummary, limits, promo, canProceed,
 *   blockedReason, notices }
 *
 * Passing `promoCode` re-runs the same preview with that code applied —
 * the response's `pricing.promoCode`/`promoDiscount` and `orderSummary`
 * reflect the discount, and `promo.applied` carries whatever the backend
 * confirmed about it. Omit `promoCode` (or pass "") to clear one already
 * applied.
 *
 * @param {string} subscriptionId - the plan's _id being purchased
 * @param {string} [promoCode] - a coupon code to apply/re-validate
 * @returns {Promise<object>} the raw `data` object above, used as-is
 * @example
 * const preview = await subscriptionAPI.previewCheckout(plan.id);
 * const withPromo = await subscriptionAPI.previewCheckout(plan.id, "WELCOME10");
 */
export const previewCheckout = async (subscriptionId, promoCode) => {
  const body = { subscriptionId };
  if (promoCode) body.promoCode = promoCode;
  const res = await request(
    "/transactions/subscribe/preview",
    "POST",
    body,
    true
  );
  return unwrap(res);
};

/**
 * Get the vendor's current active subscription ("My current subscription").
 * GET /subscribeds/get?brandId=
 *
 * `brandId` is optional for a vendor (inferred from the auth token) and
 * required only for an admin acting on a brand's behalf — so this is
 * normally called with no argument at all from vendor-facing pages.
 *
 * Response shape unconfirmed (no sample JSON shared yet) — returns
 * whatever `data` the backend sends as-is, unwrapped one level, so callers
 * can read real field names once confirmed instead of this guessing them.
 *
 * @param {string} [brandId] - only needed for an admin-context call
 * @returns {Promise<object|null>} the raw current-subscription object, or
 *   null if the brand has no active subscription
 * @example
 * const current = await subscriptionAPI.getCurrentSubscription();
 */
export const getCurrentSubscription = async (brandId) => {
  const qs = brandId ? `?brandId=${encodeURIComponent(brandId)}` : "";
  const res = await request(`/subscribeds/get${qs}`, "GET", null, true);
  return unwrap(res);
};

const subscriptionAPI = { getAll, getPlanById, previewCheckout, getCurrentSubscription };
export default subscriptionAPI;