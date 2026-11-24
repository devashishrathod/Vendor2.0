// utils/checkoutSession.js
// Tab-scoped (sessionStorage) bits of checkout that must survive a page
// refresh but aren't worth putting in the URL. The plan id and applied
// promo code live in the URL instead (?plan=&promo=) — see
// SubscriptionCheckout.jsx. sessionStorage can throw in some private/
// incognito modes, so every access is guarded and failure just means the
// value doesn't survive a refresh.

const LEGACY_BILLING_DRAFT_KEY = "subscriptionCheckoutBilling"; // old local billing draft — only cleared
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
 * Called once payment succeeds, so a refresh with ?plan= still in the URL
 * doesn't reopen checkout for a plan that's already been paid for. (The
 * billing address is saved on the server now — GET / PUT
 * /brands/billing-address — so the old local billing draft is just cleared.)
 * @param {string} planId
 */
export function markCheckoutPaid(planId) {
  write(PAID_PLAN_KEY, planId);
  write(LEGACY_BILLING_DRAFT_KEY, null);
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
