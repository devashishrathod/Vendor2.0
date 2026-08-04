import { useCallback, useEffect, useState } from "react";
import { fetchOutlets, toggleOutletStatus as toggleOutletStatusApi } from "../services/outletService";
import { OUTLET_STATUS, PAGE_SIZE } from "../constants/outletConstants";

export function useOutlets({ search, filters, page }) {
  const [outlets, setOutlets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchOutlets({ search, filters, page, pageSize: PAGE_SIZE });
      setOutlets(res.data);
      setTotal(res.total);
    } catch (err) {
      setError("Couldn't load outlets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic toggle so the UI feels instant; reloads from the server on failure.
  const toggleStatus = useCallback(
    async (id) => {
      setOutlets((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, status: o.status === OUTLET_STATUS.ACTIVE ? OUTLET_STATUS.NOT_ACTIVE : OUTLET_STATUS.ACTIVE }
            : o
        )
      );
      try {
        await toggleOutletStatusApi(id);
      } catch (err) {
        load();
      }
    },
    [load]
  );

  return { outlets, total, loading, error, reload: load, toggleStatus };
}
