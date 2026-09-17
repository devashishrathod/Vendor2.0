// ─────────────────────────────────────────────────────────────────────────────
// hooks/useSubscriptionPlans.js
// Fetches subscription plans from the API and normalizes them into the shape
// the Plan* components expect. Replaces the old static utils/Plandata import.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import subscriptionAPI from "@/features/subscriptions/services/subscriptionApi";

/**
 * @param {{ page?: number, limit?: number }} options
 * @returns {{
 *   plans: Array,
 *   meta: { total: number, totalPages: number, page: number, limit: number },
 *   loading: boolean,
 *   error: string|null,
 *   refetch: () => void,
 * }}
 */
export function useSubscriptionPlans({ page = 1, limit = 10 } = {}) {
  const [plans, setPlans] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0, page, limit });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subscriptionAPI.getAll(page, limit);

      // Handles either `res.data.data` (axios-style wrapper) or `res.data`
      // directly, depending on what your `request()` client unwraps.
      const payload = res?.data?.data ? res.data : res?.data ?? res;
      const list = payload?.data ?? [];

      const normalized = list.map((p) => ({
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
        entitlements: p.entitlements || null,
        strikePrice: p.strikePrice,
        discountAmount: p.discountAmount,
        discountPercent: p.discountPercent,
        discountType: p.discountType,
        isActive: p.isActive,
        createdAt: p.createdAt,
      }));

      setPlans(normalized);
      setMeta({
        total: payload?.total ?? normalized.length,
        totalPages: payload?.totalPages ?? 1,
        page: payload?.page ?? page,
        limit: payload?.limit ?? limit,
      });
    } catch (err) {
      setError(err?.message || "Failed to load subscription plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, meta, loading, error, refetch: fetchPlans };
}