// src/hooks/useSettlement.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSettlements } from "../services/settlementService";

const PAGE_SIZES = [10, 20, 50];

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

// No confirmed endpoint returns these account-wide totals (only the 3
// GET /settlements* endpoints exist) — shown as zero/"Not available"
// rather than the old hardcoded mock numbers, per instruction: keep the
// original UI section, just don't fabricate specific figures for it.
const ZERO_OVERVIEW = {
  previousSettlement: { amount: 0, note: "Not available" },
  todaySettlement: { amount: 0, note: "Not available" },
  availableBalance: { amount: 0, note: "Not available", count: 0 },
  gstBalance: { amount: 0, note: "Not available", count: 0 },
};

// ⚠️ Field names below are a best-effort mapping — no sample JSON response
// was shared for GET /settlements yet, only the request/params. This
// assumes the same envelope every other confirmed endpoint in this app
// uses ({ success, message, data: { total, totalPages, page, limit, data:
// [...] } }), and guesses at common field names with fallbacks. Paste a
// real response to correct any of this.
function mapSettlementRow(s) {
  return {
    settlementId: s.settlementId || s._id || "—",
    paymentReceivedDate: formatDate(s.paymentReceivedDate || s.createdAt),
    settlementOn: formatDate(s.settlementOn || s.settledAt),
    transactionId: s.transactionId || s.payoutId || "—",
    amount: s.amount ?? s.totalAmount ?? 0,
    status: s.status || (s.open ? "Open" : "Not found"),
    // Old UI's per-row "Amount Breakup" — GET /settlements (list) has no
    // confirmed per-item breakdown, so this stays zeroed rather than
    // guessed until a real response confirms these fields.
    breakup: {
      discountSummary: s.breakup?.discountSummary ?? 0,
      bestPackSummary: s.breakup?.bestPackSummary ?? 0,
      membershipSummary: s.breakup?.membershipSummary ?? 0,
      gstSummary: s.breakup?.gstSummary ?? 0,
      processingFee: s.breakup?.processingFee ?? 0,
      serviceCharge: s.breakup?.serviceCharge ?? 0,
      paidAmount: s.breakup?.paidAmount ?? s.amount ?? 0,
    },
    raw: s,
  };
}

export default function useSettlement() {
  const [overview] = useState(ZERO_OVERVIEW);
  const [banner] = useState(null);
  const [holidayNotice] = useState(null);
  const [showHolidayNotice, setShowHolidayNotice] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const [loadingTable, setLoadingTable] = useState(true);
  const [error, setError] = useState(null);

  const loadTable = useCallback(async () => {
    setLoadingTable(true);
    try {
      const res = await getSettlements({ page, limit: pageSize });
      const list = res?.data?.data ?? res?.data ?? [];
      setRows((Array.isArray(list) ? list : []).map(mapSettlementRow));
      setTotal(res?.data?.total ?? list.length ?? 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingTable(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // Client-side search over the currently-loaded page — matches the old
  // mock behaviour (no confirmed `search` query param on GET /settlements).
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.settlementId, r.transactionId, r.status, String(r.amount)]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

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
    rows: filteredRows,
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
    loadingOverview: false,
    loadingTable,
    error,
    refresh: loadTable,
  };
}
