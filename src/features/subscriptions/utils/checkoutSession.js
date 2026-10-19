// utils/checkoutSession.js
// Tab-scoped (sessionStorage) bits of checkout that must survive a page
// refresh but aren't worth putting in the URL. The plan id and applied
// promo code live in the URL instead (?plan=&promo=) — see
// SubscriptionCheckout.jsx. sessionStorage can throw in some private/
// incognito modes, so every access is guarded and failure just means the
// value doesn't survive a refresh.

const BILLING_DRAFT_KEY = "subscriptionCheckoutBilling"; // { planId, billing }
const PAID_PLAN_KEY = "subscriptionCheckoutPaidPlanId";
const RETURN_TO_KEY = "subscriptionReturnTo"; // written by SubscriptionPlan.jsx

function read(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // not fatal — see file header
  }
}

/**
 * Billing details the vendor edited on checkout but hasn't paid for yet.
 * Only returned for the same plan they were edited on.
 * @param {string} planId
 * @returns {object|null}
 */
export function readCheckoutBilling(planId) {
  try {
    const draft = JSON.parse(read(BILLING_DRAFT_KEY) || "null");
    return draft?.planId === planId ? draft.billing : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} planId
 * @param {object} billing
 */
export function saveCheckoutBilling(planId, billing) {
  write(BILLING_DRAFT_KEY, JSON.stringify({ planId, billing }));
}

/**
 * Called once payment succeeds, so a refresh with ?plan= still in the URL
 * doesn't reopen checkout for a plan that's already been paid for.
 * @param {string} planId
 */
export function markCheckoutPaid(planId) {
  write(PAID_PLAN_KEY, planId);
  write(BILLING_DRAFT_KEY, null);
}

/**
 * @param {string} planId
 * @returns {boolean}
 */
export function wasCheckoutPaid(planId) {
  return !!planId && read(PAID_PLAN_KEY) === planId;
}

/** Starting a fresh checkout from the plan picker resets the paid marker. */
export function startNewCheckout() {
  write(PAID_PLAN_KEY, null);
}

/** Where checkout's Back should go — survives refresh, unlike router state. */
export function readCheckoutReturnTo() {
  return read(RETURN_TO_KEY);
}
