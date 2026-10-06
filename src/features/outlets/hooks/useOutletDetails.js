import { useCallback, useEffect, useState } from "react";
import { useBrand } from "../../../hooks/useBrand";
import { getSubBrandsByBrandId } from "../services/subBrandApi";
import { mapSubBrandToOutlet } from "./useOutlets";
import { fetchOutletTransactionSummary } from "@/features/transaction/services/transactionService";

// ⚠️ FIXED: this used to call fetchOutletById(id) against outletService's
// MOCK_OUTLETS (ids "1".."6"), but OutletsPage/OutletCard navigate here with
// the REAL subBrand _id from useOutlets — so "Explore Details" always threw
// "Outlet not found" for every real outlet. There's no confirmed
// "get one subBrand by id" endpoint, so this instead re-fetches the brand's
// full subBrand list (same call useOutlets already makes) and picks the one
// matching :id out of it.
//
// `brand` is returned alongside `outlet` because the confirmed brands/get
// response already carries everything the details page needs beyond the
// outlet record itself — GST/PAN/bank verification, category, subscription —
// there's no separate endpoint for that.
//
// `transactions` is the outlet's REAL voucher-payment summary (it used to be
// hardcoded mock numbers). It loads independently: if it fails, the rest of
// the page still renders and `transactionsError` is set instead.

/**
 * Loads the outlet doc + its transaction summary. Never throws — returns
 * the state to apply.
 */
async function fetchOutletDetails(id, brandId) {
  try {
    const [subBrandsRes, txResult] = await Promise.all([
      getSubBrandsByBrandId(brandId),
      fetchOutletTransactionSummary({ brandId, outletId: id }).then(
        (data) => ({ data }),
        (err) => ({ error: err?.message || "Couldn't load this outlet's transactions." })
      ),
    ]);
    const list = subBrandsRes?.data?.data ?? subBrandsRes?.data ?? [];
    const doc = (Array.isArray(list) ? list : []).find((d) => d._id === id);
    if (!doc) return { outlet: null, error: "Outlet not found." };
    return {
      outlet: { ...mapSubBrandToOutlet(doc), raw: doc },
      transactions: txResult.data ?? null,
      transactionsError: txResult.error ?? "",
      error: "",
    };
  } catch (err) {
    return { outlet: null, error: err?.message || "Couldn't load this outlet's details." };
  }
}

export function useOutletDetails(id) {
  const { brand, loading: brandLoading, error: brandError } = useBrand();
  const [outlet, setOutlet] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [transactionsError, setTransactionsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const brandId = brand?._id;

  const apply = useCallback((result) => {
    setOutlet(result.outlet);
    setTransactions(result.transactions ?? null);
    setTransactionsError(result.transactionsError ?? "");
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (brandLoading || !id || !brandId) return;
    let cancelled = false;
    fetchOutletDetails(id, brandId).then((result) => {
      if (!cancelled) apply(result);
    });
    return () => {
      cancelled = true;
    };
  }, [id, brandId, brandLoading, apply]);

  // Manual reload (used after the Edit Outlet / Edit Location modals save).
  const reload = useCallback(() => {
    if (!id || !brandId) return;
    setLoading(true);
    fetchOutletDetails(id, brandId).then(apply);
  }, [id, brandId, apply]);

  return {
    outlet,
    brand,
    transactions,
    transactionsError,
    loading: loading || brandLoading,
    error: error || (brandLoading ? "" : brandError),
    reload,
  };
}
