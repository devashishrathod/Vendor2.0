import { useState, useEffect, useCallback, useRef } from "react";
import { getListingFeatures } from "../services/brandApi";

const useListingFeatures = (brandId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(!!brandId);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (!brandId) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await getListingFeatures(brandId);
      // Response shape: { success, message, data: { total, totalPages, page, limit, data: [...] } }
      const list = res?.data?.data ?? [];
      if (requestId === requestIdRef.current) {
        setData(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err.message || "Failed to load listing features.");
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

export default useListingFeatures;