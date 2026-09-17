// src/hooks/voucher/useVoucher.js
// List view: stats, pagination, search. Talks to the real VoucherService.js
// (getVouchers / getVoucherStats) — no more mock fetchVouchers/fetchVoucherStats.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "../../../onboarding/store/authStore";
import { useOnboardingStore } from "../../../onboarding/store/onboardingStore";
import useBrandData from "../../../brand/hooks/useBrandData";
import {
  getVouchers,
  submitVoucherForReview,
  publishVoucher,
} from "../../services/voucher/VoucherService";
import { fetchVoucherTransactionOverview } from "../../../transaction/services/transactionService";

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

  // Debounced so typing in the search box doesn't fire a request on every
  // keystroke — only once the vendor pauses for 400ms.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // Guards against out-of-order responses — without this, typing quickly
  // (or flipping the status/date filters in quick succession) could let an
  // earlier, slower request's response land AFTER a newer one's and
  // silently overwrite it with stale results, making the filters look
  // broken/flaky even though each individual request was correct.
  const requestIdRef = useRef(0);

  const [statsRefreshing, setStatsRefreshing] = useState(false);

  // Real data only — GET /vouchers/stats was never confirmed from Postman
  // and 404s in practice (see the old getVoucherStats comment in
  // VoucherService.js), which is why this card used to be permanently
  // stuck on "—" placeholders. Built instead from the SAME confirmed
  // sources Transactions.jsx/AnalysisReport.jsx already use: real voucher-
  // claim payments for the collection/discount amounts, and a real
  // GET /vouchers/versions/get-all?status=EXPIRED count for expired
  // vouchers (limit:1 — only its `total` is needed, not the rows).
  const loadStats = useCallback(async () => {
    if (!resolvedBrandId) return;
    try {
      const [overview, expiredRes] = await Promise.all([
        fetchVoucherTransactionOverview({ brandId: resolvedBrandId }),
        getVouchers({ brandId: resolvedBrandId, status: "EXPIRED", page: 1, limit: 1 }),
      ]);
      const discountAmount = overview.rows.reduce(
        (sum, r) => sum + Number(r.raw?.voucher?.offerDiscount || 0),
        0
      );
      setStats({
        overallCollectionAmount: overview.totalPaidAmount,
        transactionCount: overview.count,
        discountAmount: -discountAmount,
        // ⚠️ No confirmed GST field exists anywhere on the real voucher-
        // claim payment shape yet — an honest zero, matching the same
        // "Not available" GSI Collection column on the Transactions page,
        // never fabricated.
        gstAmount: 0,
        expiredVoucherCount: expiredRes?.data?.total ?? 0,
      });
    } catch (err) {
      setError(err.message);
    }
  }, [resolvedBrandId]);

  const refreshStats = useCallback(async () => {
    setStatsRefreshing(true);
    try {
      await loadStats();
    } finally {
      setStatsRefreshing(false);
    }
  }, [loadStats]);

  const loadVouchers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const res = await getVouchers({
        brandId: resolvedBrandId,
        page,
        limit: rowsPerPage,
        search: debouncedSearch,
        status: statusFilter || undefined,
        fromDate: dateRange.from || undefined,
        toDate: dateRange.to || undefined,
      });

      // A newer request has already fired (another filter/page change
      // happened while this one was in flight) — its response will land
      // separately, so applying this stale one would overwrite it.
      if (requestIdRef.current !== requestId) return;

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
      if (requestIdRef.current === requestId) setError(err.message);
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, [resolvedBrandId, page, rowsPerPage, debouncedSearch, statusFilter, dateRange.from, dateRange.to]);

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
    statsRefreshing,
    refreshStats,
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