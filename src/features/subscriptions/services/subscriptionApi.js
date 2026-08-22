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

const subscriptionAPI = { getAll, getPlanById };
export default subscriptionAPI;