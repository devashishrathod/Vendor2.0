// useBrandShowcase.js
// Loads all showcase sections + their media for a brand and exposes
// { data, loading, error, reload } — same pattern as useBrandData.js.

import { useState, useEffect, useCallback, useRef } from "react";
import { getBrandShowcase } from "../services/brandApi";

const useBrandShowcase = (brandId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!brandId);
  const [error, setError] = useState(null);

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
      const res = await getBrandShowcase(brandId);
      // Response shape: { success, message, data: { brandId, sections: [...] } }
      const showcase = res?.data ?? null;
      if (requestId === requestIdRef.current) {
        setData(showcase);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err.message || "Failed to load showcase.");
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

export default useBrandShowcase;