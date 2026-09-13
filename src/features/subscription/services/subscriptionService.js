// subscriptionService.js
// GET /subscribeds/get?brandId= — "My current subscription", confirmed
// real response shape: { success, message, data: { brand, isSubscribed,
// subscription: { status, startDate, endDate, daysRemaining, durationLabel,
// paidAmount, transactionId, pricing: { listPrice, discountPercent,
// discountAmount, gstAmount, gstPercentage, totalPayable, youSaved },
// plan: { name, type, typeLabel, price, features[], benefits[] } },
// entitlements, usage, totalSubscriptions } }. mapSubscriptionResponse maps
// that into the `subscription` shape every Subscription page component
// (PlanStatusBanner, SubscriptionInfo, InvoiceInfo, BillingInfo,
// PlanBenefits) already expects.

import axios from 'axios';
import { PLAN_STATUS } from '../constants/subscription.constants';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({ baseURL: BASE_URL });

// Attach auth token automatically (same pattern as the other feature
// services in this codebase, e.g. brandApi.js / transactionService.js).
api.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import('../../onboarding/store/authStore');
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function handleError(error) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Something went wrong. Please try again.';
  throw new Error(message);
}

/**
 * GET /subscribeds/get?brandId= — the vendor's real current subscription.
 * `brandId` is optional for a vendor (inferred from the auth token) and
 * required only for an admin acting on a brand's behalf.
 * @param {string} [brandId]
 * @returns {Promise<object|null>} the raw `data` object (brand, isSubscribed,
 *   subscription, entitlements, usage, totalSubscriptions), or null on error.
 */
export async function getCurrentSubscription(brandId) {
  try {
    const params = {};
    if (brandId) params.brandId = brandId;
    const { data } = await api.get('/subscribeds/get', { params });
    return data?.data ?? null;
  } catch (error) {
    handleError(error);
  }
}

// durationLabel is a string like "1 Year" / "6 Months" — parsed for the
// leading number rather than guessed from raw days, falling back to a
// start/end date diff if durationLabel is ever missing.
function subscriptionTermYears(durationLabel, startDate, endDate) {
  const match = durationLabel && /(\d+(?:\.\d+)?)\s*year/i.exec(durationLabel);
  if (match) return Number(match[1]);
  if (startDate && endDate) {
    const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    return Math.round(days / 365) || 0;
  }
  return 0;
}

/**
 * Maps getCurrentSubscription()'s real response (plus the separately-fetched
 * `brand` from useBrand(), for brand/GST/PAN fields the subscription
 * response doesn't carry) into the `subscription` shape the Subscription
 * page renders. Returns null while loading or if the brand genuinely has no
 * active subscription.
 *
 * @param {object|null} res - getCurrentSubscription()'s return value
 * @param {object|null} brand - useBrand()'s `brand`
 */
export function mapSubscriptionResponse(res, brand) {
  if (!res?.isSubscribed || !res?.subscription) return null;
  const sub = res.subscription;
  const pricing = sub.pricing || {};

  // "Plan Discount Price" (pre-GST) is distinct from `paidAmount`
  // (post-GST) — computed from the confirmed listPrice/discountAmount
  // fields rather than reusing totalPayable, which already includes GST.
  const discountedPrice =
    pricing.listPrice != null ? pricing.listPrice - (pricing.discountAmount || 0) : sub.paidAmount;

  return {
    status: sub.status || PLAN_STATUS.ACTIVE,
    planName: sub.plan?.name || 'Subscription Plan',
    // Real confirmed field (plan.typeLabel, e.g. "Business"/"Starter") —
    // used as the small decorative tag in the page header.
    planTypeLabel: sub.plan?.typeLabel || sub.plan?.type || 'Plan',
    brandName: brand?.brandName || brand?.legalBusinessName || '—',
    nextRenewalDate: sub.endDate,
    createdOnDate: sub.startDate,
    subscriptionTermYears: subscriptionTermYears(sub.durationLabel, sub.startDate, sub.endDate),
    expirationDate: sub.endDate,
    originalPrice: pricing.listPrice,
    discountedPrice,
    paidAmount: sub.paidAmount,
    orderId: sub.transactionId,
    // Billing address: prefer the brand's verified GST address (real,
    // government-verified), falling back to the first outlet's saved
    // location if GST verification hasn't happened.
    billingAddress:
      brand?.gst?.address?.location || brand?.firstSubBrand?.location?.formattedAddress || '—',
    gstDetails: brand?.gst?.gstNumber || '—',
    panDetails: brand?.pan?.pan || '—',
    // "Subscription Invoice" row's static copy — no confirmed endpoint
    // for a real label here yet.
    purchasedListLabel: 'Purchased List',
    currentPlanBenefitsUrl: '/subscription/benefits/current',
    // Real per-plan feature flags/limits, marketing-style benefit bullets,
    // and the brand's actual entitlement limits + current usage against
    // them — all straight from the confirmed response, nothing guessed.
    features: sub.plan?.features || [],
    benefits: sub.plan?.benefits || [],
    entitlements: res.entitlements || {},
    usage: res.usage || {},
    // "Subscription Invoice" / View History — there's no confirmed endpoint
    // that lists every past subscription, only the current one plus
    // `lastSubscription` (the one immediately before it, or null if this is
    // the brand's first). Real history is limited to whichever of those two
    // actually exist, mapped into the row shape InvoiceHistoryTable expects.
    history: [sub, res.lastSubscription].filter(Boolean).map((s) => ({
      orderId: s.transactionId || s._id,
      invoiceNumber: s.transactionId || s._id,
      planName: s.plan?.name || '—',
      date: s.startDate,
      amount: s.paidAmount,
      status: s.status,
    })),
  };
}
