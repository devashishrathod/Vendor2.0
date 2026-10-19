// useDashboardInsights.js
// Extra dashboard data beyond voucher transactions: settlements (payouts),
// open refund requests and the current subscription. Each source loads
// independently — one failing only blanks its own section.

import { useEffect, useState } from "react";
import { getSettlements } from "@/features/Settlement/services/settlementService";
import { fetchRefundOverview } from "@/features/refund/services/refundService";
import { getCurrentSubscription, mapSubscriptionResponse } from "@/features/subscription/services/subscriptionService";

const initialSection = { data: null, loading: true, error: "" };

/**
 * @param {string|undefined} brandId
 * @param {object|null} brand - brand doc (needed by mapSubscriptionResponse)
 */
export default function useDashboardInsights(brandId, brand) {
  const [settlements, setSettlements] = useState(initialSection);
  const [refunds, setRefunds] = useState(initialSection);
  const [subscription, setSubscription] = useState(initialSection);

  useEffect(() => {
    if (!brandId) return undefined;
    let cancelled = false;

    Promise.allSettled([
      getSettlements({ limit: 50 }),
      fetchRefundOverview({ open: true }),
      getCurrentSubscription(brandId),
    ]).then(([settlementRes, refundRes, subscriptionRes]) => {
      if (cancelled) return;

      if (settlementRes.status === "fulfilled") {
        const list = settlementRes.value?.data?.data ?? settlementRes.value?.data ?? [];
        setSettlements({ data: Array.isArray(list) ? list : [], loading: false, error: "" });
      } else {
        console.error("Dashboard settlements fetch failed:", settlementRes.reason);
        setSettlements({ data: [], loading: false, error: settlementRes.reason?.message || "Failed to load settlements." });
      }

      if (refundRes.status === "fulfilled") {
        setRefunds({ data: refundRes.value?.rows ?? [], loading: false, error: "" });
      } else {
        console.error("Dashboard refunds fetch failed:", refundRes.reason);
        setRefunds({ data: [], loading: false, error: refundRes.reason?.message || "Failed to load refunds." });
      }

      if (subscriptionRes.status === "fulfilled") {
        setSubscription({ data: subscriptionRes.value, loading: false, error: "" });
      } else {
        console.error("Dashboard subscription fetch failed:", subscriptionRes.reason);
        setSubscription({ data: null, loading: false, error: subscriptionRes.reason?.message || "Failed to load subscription." });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  return {
    settlements,
    refunds,
    // Mapped lazily so a late-arriving `brand` still fills brandName etc.
    subscription: {
      ...subscription,
      data: subscription.data ? mapSubscriptionResponse(subscription.data, brand) : null,
    },
  };
}
