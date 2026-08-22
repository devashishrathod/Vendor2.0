// src/hooks/voucher/useVoucher.js
// List view: stats, pagination, search. Talks to the real VoucherService.js
// (getVouchers / getVoucherStats) — no more mock fetchVouchers/fetchVoucherStats.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../../onboarding/store/authStore";
import { useOnboardingStore } from "../../../onboarding/store/onboardingStore";
import useBrandData from "../../../brand/hooks/useBrandData";
import {
  getVoucherStats,
  getVouchers,
  submitVoucherForReview,
  publishVoucher,
} from "../../services/voucher/VoucherService";

// This is the Vendor Panel — the voucher list is always the logged-in
// vendor's own vouchers, so brandId defaults to their own brand rather
// than requiring the page to pass one in. An explicit `brandId` argument
// still wins (kept for any future "view another brand" use case).
export default function useVoucher(brandId) {
  const onboardingBrandId = useOnboardingStore((s) => s.formData.brandId);
  const authUserBrandId = useAuthStore((s) => s.user?.brandId);
  const candidateBrandId = brandId || onboardingBrandId || authUserBrandId;
  // Round-trips through GET /brands/get (same as BrandPage.jsx /
  // useVoucherForm.js) so we use the backend's own confirmed brand._id
  // rather than trusting whatever's cached locally.
  const { data: brand } = useBrandData(candidateBrandId);
  const resolvedBrandId = brand?._id || candidateBrandId;
  const [stats, setStats] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await getVoucherStats({ brandId: resolvedBrandId });
      console.log(data)
      // NOTE: getVoucherStats' real response shape isn't confirmed from
      // Postman (see VoucherService.js). Adjust this mapping once you know
      // the actual keys — falling back to `data` as-is for now.
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  }, [resolvedBrandId]);

  const loadVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getVouchers({
        brandId: resolvedBrandId,
        page,
        limit: rowsPerPage,
        search,
        status: statusFilter || undefined,
        fromDate: dateRange.from || undefined,
        toDate: dateRange.to || undefined,
      });

      console.log(res)

      // Confirmed envelope: { success, message, data: { total, totalPages,
      // page, limit, data: [...] } } — each item is a voucher *version*.
      const payload = res?.data ?? {};
      const items = Array.isArray(payload.data) ? payload.data : [];
      const totalCount = payload.total ?? items.length;
      const pages = payload.totalPages ?? Math.max(1, Math.ceil(totalCount / rowsPerPage));

      setVouchers(items);
      setTotal(totalCount);
      setTotalPages(pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedBrandId, page, rowsPerPage, search, statusFilter, dateRange.from, dateRange.to]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const goToPage = useCallback(
    (nextPage) => {
      if (nextPage < 1 || nextPage > totalPages) return;
      setPage(nextPage);
    },
    [totalPages]
  );

  const changeRowsPerPage = useCallback((value) => {
    setRowsPerPage(value);
    setPage(1);
  }, []);

  const updateSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const updateStatusFilter = useCallback((value) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const updateDateRange = useCallback((range) => {
    setDateRange(range);
    setPage(1);
  }, []);

  const stateSummary = useMemo(
    () => ({
      rangeStart: total === 0 ? 0 : (page - 1) * rowsPerPage + 1,
      rangeEnd: Math.min(page * rowsPerPage, total),
    }),
    [page, rowsPerPage, total]
  );

  // Moves a DRAFT version into the review queue. Takes the voucherId
  // (not the version _id) per the confirmed endpoint.
  const submitForReview = useCallback(
    async (voucherId) => {
      setActionLoadingId(voucherId);
      setActionError(null);
      try {
        await submitVoucherForReview(voucherId);
        await loadVouchers();
      } catch (err) {
        setActionError(err.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [loadVouchers]
  );

  // Publishes a specific version once the parent voucher is APPROVED.
  // Takes the version's _id (not voucherId) per the confirmed endpoint.
  const publish = useCallback(
    async (versionId) => {
      setActionLoadingId(versionId);
      setActionError(null);
      try {
        await publishVoucher(versionId);
        await loadVouchers();
      } catch (err) {
        setActionError(err.message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [loadVouchers]
  );

  return {
    stats,
    vouchers,
    total,
    totalPages,
    page,
    rowsPerPage,
    search,
    dateRange,
    statusFilter,
    isLoading,
    error,
    stateSummary,
    actionLoadingId,
    actionError,
    goToPage,
    changeRowsPerPage,
    updateSearch,
    updateStatusFilter,
    updateDateRange,
    submitForReview,
    publish,
    refresh: loadVouchers,
  };
}