// subscriptionService.js
// There's no separate "get subscription" endpoint — the plan/subscription
// data lives under `subscribed` in the confirmed brands/get response (the
// same object useBrand() already fetches for the whole app). This file's
// only job is mapping that real brand doc into the `subscription` shape
// every Subscription page component (PlanStatusBanner, SubscriptionInfo,
// InvoiceInfo, BillingInfo, PlanBenefits) already expects.

import { PLAN_STATUS } from '../constants/subscription.constants';

// durationInDays has no separate "plan name" field anywhere in the
// confirmed brands/get response, so derive a readable label from the
// duration itself rather than showing a raw number of days.
function planLabelFromDuration(days) {
  if (!days) return 'Subscription Plan';
  if (days >= 360 && days <= 370) return 'Annual Plan';
  if (days >= 28 && days <= 31) return 'Monthly Plan';
  return `${days}-Day Plan`;
}

/**
 * Maps `useBrand()`'s `brand` (the confirmed brands/get response's `data`
 * object) into the `subscription` shape the Subscription page renders.
 * Returns null if the brand hasn't loaded yet or genuinely has no
 * `subscribed` record.
 *
 * @param {object|null} brand
 */
export function mapBrandToSubscription(brand) {
  if (!brand?.subscribed) return null;
  const sub = brand.subscribed;

  return {
    status: sub.isExpired
      ? PLAN_STATUS.EXPIRED
      : sub.isActive === false
        ? PLAN_STATUS.CANCELLED
        : PLAN_STATUS.ACTIVE,
    planName: planLabelFromDuration(sub.durationInDays),
    brandName: brand.brandName || brand.legalBusinessName || '—',
    nextRenewalDate: sub.endDate,
    createdOnDate: sub.startDate,
    subscriptionTermYears: sub.durationInDays ? Math.round(sub.durationInDays / 365) : 0,
    expirationDate: sub.endDate,
    // The confirmed response only carries a single `price` (what the plan
    // costs) and `paidAmount` (what was actually paid) — there's no
    // separate "discounted price" field, so both original/discounted show
    // the same real price rather than a fabricated discount.
    originalPrice: sub.price,
    discountedPrice: sub.price,
    paidAmount: sub.paidAmount,
    orderId: sub._id,
    // Billing address: prefer the brand's verified GST address (real,
    // government-verified), falling back to the first outlet's saved
    // location if GST verification hasn't happened.
    billingAddress:
      brand.gst?.address?.location || brand.firstSubBrand?.location?.formattedAddress || '—',
    gstDetails: brand.gst?.gstNumber || '—',
    panDetails: brand.pan?.pan || '—',
    // No support-ticket data exists in the brand response — this is
    // static copy for the "Create Ticket" row, same as purchasedListLabel.
    ticketStatus: 'No Active Ticket',
    purchasedListLabel: 'Purchased List',
    currentPlanBenefitsUrl: '/subscription/benefits/current',
  };
}
