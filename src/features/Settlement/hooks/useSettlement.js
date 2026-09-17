// src/hooks/useSettlement.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSettlements } from "../services/settlementService";

const PAGE_SIZES = [10, 20, 50];

// GET /settlements has no confirmed `search` param, so — same pattern as
// Outlets/Vouchers/AnalysisReport elsewhere in this app — one larger batch
// is fetched per date-range selection, and search + pagination happen
// entirely client-side over that batch. `from`/`to` ARE confirmed real
// query params on this endpoint, so the date range itself is applied
// server-side for real, not faked.
const FETCH_LIMIT = 200;

// Plain {from, to} date-picker range — same shape/UX as the Voucher page's
// toolbar (two native <input type="date"> values, "YYYY-MM-DD" strings,
// either side optional). `to` is pushed to the end of that day so the
// whole end date is included.
function resolveDateRange({ from, to }) {
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end = to ? new Date(`${to}T23:59:59.999`) : null;
  return {
    from: start && !Number.isNaN(start.getTime()) ? start : null,
    to: end && !Number.isNaN(end.getTime()) ? end : null,
  };
}

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

// Unlike Transactions' Razorpay status vocabulary (confirmed, fixed list),
// there's no confirmed sample response for GET /settlements — `status`
// below falls back to deriving "Open"/"Not found" from the real `open`
// boolean query param when the backend sends no `status` string of its
// own. So "Open"/"Not found" are guaranteed baseline options (the only two
// outputs mapSettlementRow's fallback can ever produce); any other real
// `status` string the backend does send gets added on top, dynamically.
const BASE_STATUS_OPTIONS = ["Open", "Not found"];

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [expandedRow, setExpandedRow] = useState(null);

  const [loadingTable, setLoadingTable] = useState(true);
  const [error, setError] = useState(null);

  // Real server-side date filter — from/to are confirmed query params on
  // GET /settlements — re-fetches the whole batch whenever the range
  // changes (not just once), so this is a genuine filter, not decoration.
  useEffect(() => {
    const range = resolveDateRange(dateRange);
    let cancelled = false;

    async function load() {
      setLoadingTable(true);
      try {
        const res = await getSettlements({
          limit: FETCH_LIMIT,
          from: range.from ? range.from.toISOString() : undefined,
          to: range.to ? range.to.toISOString() : undefined,
        });
        if (cancelled) return;
        const list = res?.data?.data ?? res?.data ?? [];
        setRows((Array.isArray(list) ? list : []).map(mapSettlementRow));
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoadingTable(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [dateRange]);

  // Manual refresh (the overview card's refresh button) — separate from
  // the effect above so it can be called on demand without re-deriving
  // useEffect dependency wiring.
  const refresh = useCallback(async () => {
    const range = resolveDateRange(dateRange);
    setLoadingTable(true);
    try {
      const res = await getSettlements({
        limit: FETCH_LIMIT,
        from: range.from ? range.from.toISOString() : undefined,
        to: range.to ? range.to.toISOString() : undefined,
      });
      const list = res?.data?.data ?? res?.data ?? [];
      setRows((Array.isArray(list) ? list : []).map(mapSettlementRow));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingTable(false);
    }
  }, [dateRange]);

  // Baseline "Open"/"Not found" (guaranteed reachable, see
  // BASE_STATUS_OPTIONS above) plus any other real status string actually
  // present in the fetched batch — so a status doesn't have to already be
  // on screen to be filterable, without inventing values that aren't real.
  const statusOptions = useMemo(
    () => [...new Set([...BASE_STATUS_OPTIONS, ...rows.map((r) => r.status).filter(Boolean)])],
    [rows]
  );

  // Search + Status — both applied client-side over the fetched batch
  // (no confirmed `search` query param on GET /settlements).
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !term ||
        [r.settlementId, r.transactionId, r.status, String(r.amount)]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const total = filteredRows.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // Client-side pagination over the filtered set — the "page" the table
  // actually renders, now always in sync with `total`/`totalPages` above
  // (search/status/date-range no longer desync the row count from the
  // pagination bar).
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const toggleRow = useCallback((settlementId) => {
    setExpandedRow((prev) => (prev === settlementId ? null : settlementId));
  }, []);

  const onSearchChange = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const onStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const onDateRangeChange = useCallback((value) => {
    setDateRange(value);
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
    rows: pagedRows,
    total,
    page,
    setPage,
    pageSize,
    onPageSizeChange,
    pageSizes: PAGE_SIZES,
    totalPages,
    search,
    onSearchChange,
    statusOptions,
    statusFilter,
    onStatusFilterChange,
    dateRange,
    onDateRangeChange,
    expandedRow,
    toggleRow,
    loadingOverview: false,
    loadingTable,
    error,
    refresh,
  };
}
