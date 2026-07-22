// src/hooks/useSettlement.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSettlementOverview, fetchSettlements } from "../services/settlementService";

const PAGE_SIZES = [10, 20, 50];

export default function useSettlement() {
  const [overview, setOverview] = useState(null);
  const [banner, setBanner] = useState(null);
  const [holidayNotice, setHolidayNotice] = useState(null);
  const [showHolidayNotice, setShowHolidayNotice] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("Feb 30, 2025 - Feb 25, 2025 23:59");
  const [expandedRow, setExpandedRow] = useState(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await fetchSettlementOverview();
      setOverview(data.overview);
      setBanner(data.banner);
      setHolidayNotice(data.holidayNotice);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadTable = useCallback(async () => {
    setLoadingTable(true);
    try {
      const data = await fetchSettlements({ page, pageSize, search });
      setRows(data.rows);
      setTotal(data.total);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingTable(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const toggleRow = useCallback((settlementId) => {
    setExpandedRow((prev) => (prev === settlementId ? null : settlementId));
  }, []);

  const onSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const onPageSizeChange = useCallback((size) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    overview,
    banner,
    holidayNotice,
    showHolidayNotice,
    setShowHolidayNotice,
    showBanner,
    setShowBanner,
    rows,
    total,
    page,
    setPage,
    pageSize,
    onPageSizeChange,
    pageSizes: PAGE_SIZES,
    totalPages,
    search,
    onSearchChange,
    dateRange,
    setDateRange,
    expandedRow,
    toggleRow,
    loadingOverview,
    loadingTable,
    error,
    refresh: () => {
      loadOverview();
      loadTable();
    },
  };
}
