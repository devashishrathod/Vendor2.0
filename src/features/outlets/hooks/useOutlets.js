import { useCallback, useEffect, useState } from "react";
import { getSubBrandsByBrandId, updateSubBrand } from "../services/subBrandApi";
import { OUTLET_STATUS, PAGE_SIZE } from "../constants/outletConstants";

// ── Maps one subBrand doc (from subBrands/get-all) into the shape
// OutletCard/OutletGrid already render — { id, storeId, whatsapp: { number,
// verified }, outletType, joinedDate, status }.
// ⚠️ The confirmed subBrands/get-all doc has no `whatsappVerified` field,
// so `verified` always evaluates to false until the backend adds one.
//
// ⚠️ FIXED: outletType is now lowercased ("outlet"/"franchise") to match
// OUTLET_TYPES/OUTLET_TYPE_LABELS/FILTER_OPTIONS, which all use lowercase
// values. This was previously uppercased ("OUTLET"/"FRANCHISE"), which
// silently broke two things: OutletCard's "Outlet Type" row always fell
// back to "—" (the label lookup never matched), and the Outlet/Franchise
// filter checkboxes matched nothing at all (filters.type holds lowercase
// values from FILTER_OPTIONS, compared against this uppercase field).
export function mapSubBrandToOutlet(doc) {
  const location = doc.location;
  return {
    id: doc._id,
    storeId: doc.storeId || doc.uniqueId || doc._id,
    uniqueId: doc.uniqueId || "",
    whatsapp: {
      number: doc.whatsappNumber || "",
      verified: !!doc.whatsappVerified,
    },
    outletType: (doc.outletType || "").toLowerCase(),
    joinedDate: doc.joinedDate || doc.createdAt,
    status: doc.isActive === false ? OUTLET_STATUS.NOT_ACTIVE : OUTLET_STATUS.ACTIVE,
    description: doc.description || "",
    // Only present when the subBrands/get-all doc embeds its location (not
    // every outlet has one saved yet) — OutletCard shows it when set.
    address: location
      ? location.formattedAddress ||
        [location.addressLine1, location.addressLine2, location.city, location.state, location.zipcode]
          .filter(Boolean)
          .join(", ")
      : "",
    // Full subBrand doc, kept around for anything that needs more than the
    // flattened fields above — e.g. EditOutletModal needs the raw
    // outletType/description/isActive/location to prefill an edit form.
    raw: doc,
  };
}

// ── search/filters are applied client-side since subBrands/get-all only
// confirmed to take `brandId` — swap this for real query params if the
// backend adds server-side search/status filtering on that endpoint.
// Pulled out as its own function so the live list AND the "Export Data"
// button (which needs the FULL matching set, not just the current page)
// both filter identically — no risk of the export silently disagreeing
// with what's actually on screen.
// Custom date range filter — applied to `joinedDate` (the only real,
// confirmed date field on an outlet). `from`/`to` are plain "YYYY-MM-DD"
// values from a native <input type="date">; the "to" side is inclusive of
// the whole day.
function isWithinDateRange(iso, range) {
  if (!range?.from && !range?.to) return true;
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  if (range.from && date < new Date(`${range.from}T00:00:00`)) return false;
  if (range.to && date > new Date(`${range.to}T23:59:59.999`)) return false;
  return true;
}

function filterOutlets(mapped, { search, filters, dateRange } = {}) {
  const q = (search || "").trim().toLowerCase();
  return mapped.filter((o) => {
    const matchesSearch =
      !q || o.storeId?.toLowerCase().includes(q) || o.status?.toLowerCase().includes(q);
    const matchesStatus = !filters?.status?.length || filters.status.includes(o.status);
    const matchesType = !filters?.type?.length || filters.type.includes(o.outletType);
    const matchesDate = isWithinDateRange(o.joinedDate, dateRange);
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });
}

// Sort — by real fields only: joinedDate (falls back to createdAt via
// mapSubBrandToOutlet already) or storeId (alphabetic).
function sortOutlets(list, sortBy, sortOrder) {
  const sorted = [...list].sort((a, b) => {
    if (sortBy === "storeId") {
      return (a.storeId || "").localeCompare(b.storeId || "");
    }
    return new Date(a.joinedDate || 0) - new Date(b.joinedDate || 0);
  });
  return sortOrder === "desc" ? sorted.reverse() : sorted;
}

function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  // Leading BOM so Excel (not just browsers) recognizes this as UTF-8
  // instead of mangling the ₹/— characters into mojibake.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useOutlets({ search, filters, dateRange, sortBy, sortOrder, page, brandId } = {}) {
  const [outlets, setOutlets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

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
      const filtered = filterOutlets(mapped, { search, filters, dateRange });
      const sorted = sortOutlets(filtered, sortBy, sortOrder);

      const start = (page - 1) * PAGE_SIZE;
      const pageSlice = sorted.slice(start, start + PAGE_SIZE);

      setOutlets(pageSlice);
      setTotal(sorted.length);
    } catch {
      setError("Couldn't load outlets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [brandId, search, filters, dateRange, sortBy, sortOrder, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Exports ALL subBrand fields for every outlet matching the currently
  // applied search + filters — NOT just the current page. Fetches fresh
  // (rather than reusing `outlets`, which only ever holds one page) so the
  // export is never missing rows the merchant hasn't scrolled/paged to.
  const exportOutlets = useCallback(async () => {
    if (!brandId) return;
    setExporting(true);
    try {
      const res = await getSubBrandsByBrandId(brandId);
      const list = res?.data?.data ?? res?.data ?? [];
      const docs = Array.isArray(list) ? list : [];
      const mapped = docs.map(mapSubBrandToOutlet);
      const filtered = filterOutlets(mapped, { search, filters, dateRange });
      const sorted = sortOutlets(filtered, sortBy, sortOrder);

      const headers = [
        "Store Id",
        "Unique Id",
        "WhatsApp Number",
        "WhatsApp Verified",
        "Outlet Type",
        "Status",
        "Joined Date",
        "Description",
        "Address",
      ];
      const rows = sorted.map((o) => [
        o.storeId,
        o.uniqueId,
        o.whatsapp.number,
        o.whatsapp.verified ? "Yes" : "No",
        o.outletType,
        o.status,
        o.joinedDate,
        o.description,
        o.address,
      ]);

      downloadCsv("outlets-export.csv", headers, rows);
    } catch {
      setError("Couldn't export outlets. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [brandId, search, filters, dateRange, sortBy, sortOrder]);

  // Optimistic toggle so the UI feels instant; reloads from the server on failure.
  const toggleStatus = useCallback(
    async (id) => {
      const current = outlets.find((o) => o.id === id);
      if (!current) return;
      const nextStatus = current.status === OUTLET_STATUS.ACTIVE ? OUTLET_STATUS.NOT_ACTIVE : OUTLET_STATUS.ACTIVE;

      setOutlets((prev) => prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)));
      try {
        await updateSubBrand(id, { isActive: nextStatus === OUTLET_STATUS.ACTIVE });
      } catch {
        load();
      }
    },
    [outlets, load]
  );

  return { outlets, total, loading, error, reload: load, toggleStatus, exportOutlets, exporting };
}