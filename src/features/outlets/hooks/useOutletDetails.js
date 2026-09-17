import { useEffect, useState } from "react";
import { useBrand } from "../../../hooks/useBrand";
import { getSubBrandsByBrandId } from "../services/subBrandApi";
import { mapSubBrandToOutlet } from "./useOutlets";
import { fetchOutletTransactions } from "../services/outletService";

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
export function useOutletDetails(id) {
  const { brand, loading: brandLoading, error: brandError } = useBrand();
  const [outlet, setOutlet] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const brandId = brand?._id;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id || !brandId) return;
      setLoading(true);
      setError("");
      try {
        const [subBrandsRes, txData] = await Promise.all([
          getSubBrandsByBrandId(brandId),
          fetchOutletTransactions(id),
        ]);
        const list = subBrandsRes?.data?.data ?? subBrandsRes?.data ?? [];
        const docs = Array.isArray(list) ? list : [];
        const doc = docs.find((d) => d._id === id);

        if (cancelled) return;
        if (!doc) {
          setError("Outlet not found.");
          setOutlet(null);
        } else {
          setOutlet({ ...mapSubBrandToOutlet(doc), raw: doc });
          setTransactions(txData);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Couldn't load this outlet's details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!brandLoading) load();
    return () => {
      cancelled = true;
    };
  }, [id, brandId, brandLoading]);

  // Manual reload (used after the Edit Outlet modal saves) — separate from
  // the mount/brand-change effect above so it can be called on demand.
  const reload = () => {
    if (!id || !brandId) return;
    setLoading(true);
    setError("");
    Promise.all([getSubBrandsByBrandId(brandId), fetchOutletTransactions(id)])
      .then(([subBrandsRes, txData]) => {
        const list = subBrandsRes?.data?.data ?? subBrandsRes?.data ?? [];
        const docs = Array.isArray(list) ? list : [];
        const doc = docs.find((d) => d._id === id);
        if (!doc) {
          setError("Outlet not found.");
          setOutlet(null);
        } else {
          setOutlet({ ...mapSubBrandToOutlet(doc), raw: doc });
          setTransactions(txData);
        }
      })
      .catch((err) => setError(err?.message || "Couldn't load this outlet's details."))
      .finally(() => setLoading(false));
  };

  return {
    outlet,
    brand,
    transactions,
    loading: loading || brandLoading,
    error: error || (brandLoading ? "" : brandError),
    reload,
  };
}
