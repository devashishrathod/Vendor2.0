// useBrandData.js
// Loads the brand profile for a given brandId and exposes
// { data, loading, error, reload } to any component that needs it.

import { useState, useEffect, useCallback, useRef } from "react";
import { getBrandById } from "../services/brandApi";

const useBrandData = (brandId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!brandId);
  const [error, setError] = useState(null);

  // Guards against a slow earlier request overwriting a newer one
  // if brandId changes quickly (e.g. switching outlets).
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!brandId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await getBrandById(brandId);
      console.log("[useBrandData] raw response for brandId", brandId, ":", res);
      // API responses in this codebase are wrapped as { data: {...} };
      // unwrap so consumers get the brand object directly.
      const profile = res?.data ?? res;
      console.log("[useBrandData] unwrapped profile:", profile);
      if (requestId === requestIdRef.current) {
        setData(profile);
      }
    } catch (err) {
      console.error("[useBrandData] fetch failed for brandId", brandId, ":", err);
      if (requestId === requestIdRef.current) {
        setError(err.message || "Failed to load brand data.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [brandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
};

export default useBrandData;