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
import { PLAN_STATUS, TRYDOOD_BILLING } from '../constants/subscription.constants';

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

// The download link can come back relative ("/documents/:token") — resolve
// it against the API base so the browser opens the API host, not the panel.
function toAbsoluteUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${String(BASE_URL || '').replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}

/**
 * POST /transactions/invoice/regenerate — issues (or re-issues) the tax
 * invoice PDF for a paid subscription transaction. There's no GET for an
 * invoice: this is the only call that returns the invoice number + PDF.
 * Amounts are never recomputed — it's built from the transaction's frozen
 * pricing.
 *
 * The LIVE response differs from the API doc: invoiceId /
 * invoiceDownloadUrl / snapshot sit straight on `data`, and `invoiceUrl` is
 * null — the PDF is the invoiceDownloadUrl (/documents/:token) link. The
 * doc's `data.invoice.{ invoiceId, invoiceUrl, issuedAt }` is kept as a
 * fallback (same handling as the admin panel).
 * @param {string} transactionId - subscription.transactionId from /subscribeds/get
 * @returns {Promise<{ invoiceId: string|null, invoiceUrl: string|null, issuedAt: string|null }|null>}
 */
export async function regenerateSubscriptionInvoice(transactionId) {
  try {
    const { data } = await api.post('/transactions/invoice/regenerate', { transactionId });
    const d = data?.data;
    if (!d) return null;
    const snapshot = d.snapshot ?? null;
    return {
      invoiceId: d.invoiceId ?? snapshot?.documentNumber ?? d.invoice?.invoiceId ?? null,
      invoiceUrl: toAbsoluteUrl(d.invoiceDownloadUrl ?? d.invoiceUrl ?? d.invoice?.invoiceUrl),
      issuedAt: snapshot?.issuedAt ?? d.invoice?.issuedAt ?? null,
    };
  } catch (error) {
    handleError(error);
  }
}

/**
 * One /subscribeds/history row → the shape the history table renders. The
 * LIVE field names differ from the API doc: toPlan / fromPlan (not
 * planName), amount (not paidAmount), performedByUser / performedByRole
 * (not performedBy / performedByType), reason (not note), and the forfeit
 * numbers under snapshot. The doc names stay as fallbacks — same mapping
 * the admin panel uses (BrandAdminExtras normalizeHistory).
 * @param {object} h - raw history row
 */
export function mapHistoryRow(h) {
  const snap = h.snapshot || {};
  const toPlan = h.toPlan || (h.planName ? { name: h.planName } : h.plan || null);
  return {
    id: h._id,
    subscribedId: h.subscribedId,
    action: h.action,
    createdAt: h.createdAt,
    fromPlanName: h.fromPlan?.name || null,
    toPlanName: toPlan?.name || null,
    startDate: h.startDate,
    endDate: h.endDate,
    amount: h.amount ?? h.paidAmount ?? null,
    // On a FREE grant `amount` is the plan's value — nothing was collected.
    isFree: h.paymentMode === 'FREE',
    by: h.performedByUser?.name || h.performedBy?.name || '',
    byRole: h.performedByRole || h.performedByType || h.performedByUser?.role || '',
    reason: h.reason ?? h.note ?? '',
    forfeitedDays: snap.forfeitedDays ?? h.forfeitedDays ?? 0,
    forfeitedValue: snap.forfeitedValue ?? h.forfeitedValue ?? 0,
    isTrial: Boolean(snap.isTrial),
  };
}

/**
 * GET /subscribeds/history — the brand's subscription audit trail
 * (ORDER_CREATED, ACTIVATED, UPGRADED, EXPIRED, …), newest first. Vendors
 * don't pass brandId (it comes from the token). Response: { data: { total,
 * page, limit, data: [row] } } — rows are mapped by mapHistoryRow.
 * @param {{ page?: number, limit?: number }} [params] - limit is capped at 100 by the API
 * @returns {Promise<{ total: number, page: number, limit: number, data: ReturnType<typeof mapHistoryRow>[] }>}
 */
export async function getSubscriptionHistory({ page = 1, limit = 100 } = {}) {
  try {
    const { data } = await api.get('/subscribeds/history', { params: { page, limit } });
    const res = data?.data ?? { total: 0, page, limit, data: [] };
    return { ...res, data: (res.data || []).map(mapHistoryRow) };
  } catch (error) {
    handleError(error);
  }
}

/**
 * Request a refund of the current subscription.
 * ⚠️ NOT CONNECTED: no subscription-refund endpoint has been confirmed
 * yet, so this rejects with a clear message instead of calling a guessed
 * URL. Once the real endpoint is known, replace the body with the api call
 * (the modal already sends { transactionId, amount, reason, note }).
 * @param {{ transactionId: string, amount: number, reason: string, note?: string }} payload
 * @returns {Promise<object>}
 */
export async function requestSubscriptionRefund(payload) {
  console.warn('requestSubscriptionRefund: API not connected yet, payload not sent:', payload);
  throw new Error('Refund request is not available yet — the refund API has not been connected.');
}

// ⚠️ FIXED: this used to force every plan's term into a whole-number-of-
// years count (parsed from durationLabel, or days/365 rounded as a
// fallback) — a Trial/Quarterly plan (~88 days, well under a year) always
// rounded down to 0, showing the nonsensical "0 Years". durationLabel is
// itself the real, confirmed field (a ready-to-display string like
// "1 Year" / "6 Months" / "Trial") — showing it as-is avoids the whole
// years-only assumption. The day-diff fallback below only runs if
// durationLabel is ever missing, and picks whichever unit (years/months/
// days) actually divides evenly instead of always defaulting to years.
function formatSubscriptionTerm(durationLabel, startDate, endDate) {
  if (durationLabel) return durationLabel;
  if (startDate && endDate) {
    const days = Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    if (days <= 0) return '—';
    if (days % 365 === 0) {
      const years = days / 365;
      return `${years} Year${years === 1 ? '' : 's'}`;
    }
    if (days % 30 === 0) {
      const months = days / 30;
      return `${months} Month${months === 1 ? '' : 's'}`;
    }
    return `${days} Day${days === 1 ? '' : 's'}`;
  }
  return '—';
}

// Brand's GST address as one line, falling back to the first outlet's saved
// location. The GST record repeats itself — `location` already holds most of
// the address and buildingName / city / district / state / pin repeat parts
// of it — so it's split on commas and each part is kept only once.
function formatBrandAddress(brand) {
  const addr = brand?.gst?.address;
  if (!addr) return brand?.firstSubBrand?.location?.formattedAddress || '—';

  const seen = new Set();
  const parts = [addr.floorNumber, addr.buildingNumber, addr.buildingName, addr.location, addr.city, addr.district, addr.state, addr.pin]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((part) => part.trim())
    .filter((part) => {
      const key = part.toLowerCase();
      if (!part || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return parts.join(', ') || brand?.firstSubBrand?.location?.formattedAddress || '—';
}

// Tax lines from the frozen pricing snapshot: CGST + SGST for an
// intra-state sale, IGST for inter-state, or one GST line if only the
// total is present.
function buildTaxLines(pricing) {
  const rate = pricing.gstPercentage;
  if (pricing.igst > 0) return [{ label: `IGST${rate != null ? ` (${rate}%)` : ''}`, amount: pricing.igst }];
  if (pricing.cgst > 0 || pricing.sgst > 0) {
    const half = rate != null ? ` (${rate / 2}%)` : '';
    return [
      { label: `CGST${half}`, amount: pricing.cgst },
      { label: `SGST${half}`, amount: pricing.sgst },
    ];
  }
  if (pricing.gstAmount > 0) return [{ label: `GST${rate != null ? ` (${rate}%)` : ''}`, amount: pricing.gstAmount }];
  return [];
}

/**
 * The tax invoice for the current subscription, built from the frozen
 * pricing snapshot in /subscribeds/get. The invoice number + PDF aren't in
 * that response — useInvoice adds them from regenerateSubscriptionInvoice.
 * @param {object} sub - res.subscription
 * @param {object|null} brand - useBrand()'s `brand`
 */
function buildSubscriptionInvoice(sub, brand) {
  const pricing = sub.pricing || {};
  const planLabel = [sub.plan?.name, sub.durationLabel || sub.plan?.durationLabel].filter(Boolean).join(' · ');
  const total = pricing.totalPayable ?? sub.paidAmount ?? 0;

  const lineItems = [
    { label: `${planLabel || 'Subscription'} plan`, amount: pricing.listPrice ?? sub.plan?.price },
    pricing.discountAmount > 0 && {
      label: `Discount${pricing.discountPercent ? ` (${pricing.discountPercent}%)` : ''}`,
      amount: -pricing.discountAmount,
    },
    pricing.promoDiscount > 0 && {
      label: `Promo discount${pricing.promoCode ? ` (${pricing.promoCode})` : ''}`,
      amount: -pricing.promoDiscount,
    },
    pricing.prorationCredit > 0 && { label: 'Credit from previous plan', amount: -pricing.prorationCredit },
    pricing.taxableValue != null && { label: 'Taxable value', amount: pricing.taxableValue, emphasis: true },
    ...buildTaxLines(pricing),
    pricing.roundOff ? { label: 'Round off', amount: pricing.roundOff } : null,
  ].filter(Boolean);

  return {
    subscriptionId: sub._id,
    transactionId: sub.transactionId,
    invoiceDate: sub.startDate,
    planName: sub.plan?.name || 'Subscription Plan',
    period: { start: sub.startDate, end: sub.endDate },
    amount: total,
    paymentStatus: total > 0 ? 'PAID' : 'NOTHING_TO_PAY',
    hsnSacCode: pricing.hsnSacCode || null,
    placeOfSupply: pricing.placeOfSupplyState || null,
    billFrom: TRYDOOD_BILLING,
    billTo: {
      companyName: brand?.legalBusinessName || brand?.brandName || '—',
      address: formatBrandAddress(brand),
      gstin: brand?.gst?.gstNumber || '—',
      pan: brand?.pan?.pan || '—',
    },
    lineItems,
  };
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

  // Refunds are the full amount paid MINUS GST (GST isn't refundable):
  // totalPayable - gstAmount when both confirmed fields are present, else
  // the pre-GST plan price above. null when neither can be computed, so
  // the refund modal shows "—" instead of a guessed number.
  const amountPaid = pricing.totalPayable ?? sub.paidAmount;
  const refundableAmount =
    amountPaid != null && pricing.gstAmount != null
      ? Math.max(0, amountPaid - pricing.gstAmount)
      : pricing.listPrice != null
        ? discountedPrice
        : null;

  return {
    status: sub.status || PLAN_STATUS.ACTIVE,
    planName: sub.plan?.name || 'Subscription Plan',
    // Real confirmed field (plan.typeLabel, e.g. "Business"/"Starter") —
    // used as the small decorative tag in the page header.
    planTypeLabel: sub.plan?.typeLabel || sub.plan?.type || 'Plan',
    brandName: brand?.brandName || brand?.legalBusinessName || '—',
    nextRenewalDate: sub.endDate,
    createdOnDate: sub.startDate,
    subscriptionTerm: formatSubscriptionTerm(sub.durationLabel, sub.startDate, sub.endDate),
    expirationDate: sub.endDate,
    originalPrice: pricing.listPrice,
    discountedPrice,
    paidAmount: sub.paidAmount,
    gstAmount: pricing.gstAmount,
    gstPercentage: pricing.gstPercentage,
    refundableAmount,
    subscriptionId: sub._id,
    orderId: sub.transactionId,
    // Billing address: prefer the brand's verified GST address (real,
    // government-verified), falling back to the first outlet's saved
    // location if GST verification hasn't happened.
    billingAddress:
      brand?.gst?.address?.location || brand?.firstSubBrand?.location?.formattedAddress || '—',
    gstDetails: brand?.gst?.gstNumber || '—',
    panDetails: brand?.pan?.pan || '—',
    currentPlanBenefitsUrl: '/subscription/benefits/current',
    // Real per-plan feature flags/limits, marketing-style benefit bullets,
    // and the brand's actual entitlement limits + current usage against
    // them — all straight from the confirmed response, nothing guessed.
    features: sub.plan?.features || [],
    benefits: sub.plan?.benefits || [],
    entitlements: res.entitlements || {},
    usage: res.usage || {},
    // Tax invoice for this subscription (View Invoice). Purchase history is
    // fetched separately from GET /subscribeds/history (useInvoiceHistory).
    invoice: buildSubscriptionInvoice(sub, brand),
  };
}
