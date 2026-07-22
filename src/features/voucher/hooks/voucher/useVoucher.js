// src/hooks/voucher/useVoucher.js
// Add/Edit form logic now lives in useVoucherForm.js — this hook only
// handles the list view: stats, pagination, and search.
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchVoucherStats, fetchVouchers } from "../../services/voucher/voucherService";

export default function useVoucher() {
  const [stats, setStats] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchVoucherStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadVouchers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchVouchers({ page, rowsPerPage, search });
      setVouchers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, search]);

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

  const stateSummary = useMemo(
    () => ({
      rangeStart: total === 0 ? 0 : (page - 1) * rowsPerPage + 1,
      rangeEnd: Math.min(page * rowsPerPage, total),
    }),
    [page, rowsPerPage, total]
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
    isLoading,
    error,
    stateSummary,
    setDateRange,
    goToPage,
    changeRowsPerPage,
    updateSearch,
    refresh: loadVouchers,
  };
}