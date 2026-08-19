import { useCallback, useEffect, useState } from "react";
import { getSubBrandsByBrandId, updateSubBrand } from "../services/subBrandApi";
import { OUTLET_STATUS, PAGE_SIZE } from "../constants/outletConstants";

// ── Maps one subBrand doc (from subBrands/getAll) into the shape
// OutletCard/OutletGrid already render — { id, storeId, whatsapp: { number,
// verified }, outletType, joinedDate, status }.
// ⚠️ ADJUST: `storeId`, `whatsappVerified` field names are best guesses off
// the same doc shape getBrandWithSubBrand already reads in subBrandApi.js
// (subBrand.whatsappNumber, placeholder subBrand.whatsappVerified) — paste
// one real subBrands/getAll list item if the card ends up blank/wrong.
function mapSubBrandToOutlet(doc) {
  return {
    id: doc._id,
    storeId: doc.storeId || doc.uniqueId || doc._id,
    whatsapp: {
      number: doc.whatsappNumber || "",
      verified: !!doc.whatsappVerified,
    },
    outletType: (doc.outletType || "").toUpperCase(),
    joinedDate: doc.joinedDate || doc.createdAt,
    status: doc.isActive === false ? OUTLET_STATUS.NOT_ACTIVE : OUTLET_STATUS.ACTIVE,
    description: doc.description || "",
  };
}

export function useOutlets({ search, filters, page, brandId } = {}) {
  const [outlets, setOutlets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!brandId) {
      setOutlets([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await getSubBrandsByBrandId(brandId);
      const list = res?.data?.data ?? res?.data ?? [];
      const docs = Array.isArray(list) ? list : [];

      const mapped = docs.map(mapSubBrandToOutlet);

      // ⚠️ search/filters/page are applied client-side here since
      // subBrands/getAll only confirmed to take `brandId` — swap this for
      // real query params if the backend supports server-side
      // search/status filtering on that endpoint.
      const q = (search || "").trim().toLowerCase();
      const filtered = mapped.filter((o) => {
        const matchesSearch =
          !q || o.storeId?.toLowerCase().includes(q) || o.status?.toLowerCase().includes(q);
        const matchesStatus = !filters?.status?.length || filters.status.includes(o.status);
        const matchesType = !filters?.type?.length || filters.type.includes(o.outletType);
        return matchesSearch && matchesStatus && matchesType;
      });

      const start = (page - 1) * PAGE_SIZE;
      const pageSlice = filtered.slice(start, start + PAGE_SIZE);

      setOutlets(pageSlice);
      setTotal(filtered.length);
    } catch (err) {
      setError("Couldn't load outlets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [brandId, search, filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic toggle so the UI feels instant; reloads from the server on failure.
  const toggleStatus = useCallback(
    async (id) => {
      const current = outlets.find((o) => o.id === id);
      if (!current) return;
      const nextStatus = current.status === OUTLET_STATUS.ACTIVE ? OUTLET_STATUS.NOT_ACTIVE : OUTLET_STATUS.ACTIVE;

      setOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)));
      try {
        await updateSubBrand(id, { isActive: nextStatus === OUTLET_STATUS.ACTIVE });
      } catch (err) {
        load();
      }
    },
    [outlets, load]
  );

  return { outlets, total, loading, error, reload: load, toggleStatus };
}