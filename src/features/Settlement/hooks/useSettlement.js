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
const FETCH_LIMIT = 100;

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

// Date-only (no time) — used for the table's "Period" column, since
// showing both periodStart AND periodEnd with a full timestamp each made
// that one cell far wider than every other column.
const formatDateOnly = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

const isSameDay = (iso, reference) => {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
};

// Confirmed real statuses (from a real GET /settlements sample, and
// matching the lifecycle a settlement's own `timeline` walks through on
// the details page: DRAFT → PENDING_APPROVAL → APPROVED → PROCESSING →
// PAID). Shown as friendly labels here and matched against each row's own
// `statusLabel` below, rather than the raw enum string.
const BASE_STATUS_OPTIONS = ["Draft", "Pending Approval", "Approved", "Processing", "Paid"];

// Confirmed real shape for GET /settlements — each item is the same
// settlement doc the details page's GET /settlements/:id returns (just
// without that endpoint's extra `legs`/`timeline`/`viewer`), so this reuses
// the exact same real fields useSettlementDetails.js's mapSettlementDetail
// does — grossCollected/commission*/refundAdjustment/.../netPayable,
// bankSnapshot, statusLabel — instead of the previous best-effort guess.
function mapSettlementRow(s) {
  return {
    id: s._id,
    settlementNumber: s.settlementNumber || "—",
    status: s.status || "—",
    statusLabel: s.statusLabel || s.status || "—",
    cycleType: s.cycleType || "—",
    periodStart: formatDateOnly(s.periodStart),
    periodEnd: formatDateOnly(s.periodEnd),
    createdAt: formatDate(s.createdAt),
    approvedAt: formatDate(s.approvedAt),
    paidAt: formatDate(s.paidAt),
    transactionCount: s.transactionCount ?? 0,
    bankName: s.bankSnapshot?.bankName || "—",
    bankLast4: s.bankSnapshot?.accountLast4Digits || "—",
    netPayable: s.netPayable ?? 0,
    breakup: {
      grossCollected: s.grossCollected ?? 0,
      vendorPromoCost: s.vendorPromoCost ?? 0,
      commissionAmount: s.commissionAmount ?? 0,
      commissionTax: s.commissionTax ?? 0,
      commissionDeduction: s.commissionDeduction ?? 0,
      refundAdjustment: s.refundAdjustment ?? 0,
      chargebackAdjustment: s.chargebackAdjustment ?? 0,
      reserveHeld: s.reserveHeld ?? 0,
      reservePercent: s.reservePercent ?? 0,
      reserveReleased: s.reserveReleased ?? 0,
      reserveReason: s.reserveBasis?.reason || null,
      netPayable: s.netPayable ?? 0,
    },
    raw: s,
  };
}

export default function useSettlement() {
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

  // Real overview, derived from the same fetched batch the table shows —
  // no dedicated "account totals" endpoint is confirmed, so this is built
  // from real per-settlement fields instead of the old hardcoded
  // ZERO_OVERVIEW placeholder. "Available balance" = still-unpaid
  // settlements' netPayable, summed (a genuine derived real number, not a
  // fabricated one). "GST balance" has no real source anywhere on this
  // object (commissionTax is platform commission, not customer-facing
  // GST) — stays an honest "Not available" rather than reusing that field.
  const overview = useMemo(() => {
    const now = new Date();
    const paidRows = rows.filter((r) => r.status === "PAID" && r.raw?.paidAt);
    const sortedByPaidAt = [...paidRows].sort(
      (a, b) => new Date(b.raw.paidAt) - new Date(a.raw.paidAt)
    );
    const todaySettlement = sortedByPaidAt.find((r) => isSameDay(r.raw.paidAt, now));
    const previousSettlement = sortedByPaidAt.find((r) => !isSameDay(r.raw.paidAt, now));
    const unpaidRows = rows.filter((r) => r.status !== "PAID");
    const availableBalance = unpaidRows.reduce((sum, r) => sum + (r.netPayable || 0), 0);

    return {
      previousSettlement: previousSettlement
        ? { amount: previousSettlement.netPayable, note: previousSettlement.paidAt }
        : { amount: 0, note: "Not available" },
      todaySettlement: todaySettlement
        ? { amount: todaySettlement.netPayable, note: todaySettlement.paidAt }
        : { amount: 0, note: "Not settled yet" },
      availableBalance: {
        amount: availableBalance,
        note: unpaidRows.length ? "Awaiting payout" : "Not available",
        count: unpaidRows.length,
      },
      // ⚠️ No confirmed GST field exists anywhere on the real settlement
      // object — commissionTax is the platform's own commission tax, not
      // a customer-facing GST balance, so this stays honest rather than
      // reusing that field.
      gstBalance: { amount: 0, note: "Not available", count: 0 },
    };
  }, [rows]);

  // Baseline lifecycle labels (guaranteed reachable, see
  // BASE_STATUS_OPTIONS above) plus any other real statusLabel actually
  // present in the fetched batch — so a status doesn't have to already be
  // on screen to be filterable, without inventing values that aren't real.
  const statusOptions = useMemo(
    () => [...new Set([...BASE_STATUS_OPTIONS, ...rows.map((r) => r.statusLabel).filter(Boolean)])],
    [rows]
  );

  // Search + Status — both applied client-side over the fetched batch
  // (no confirmed `search` query param on GET /settlements).
  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !term ||
        [r.settlementNumber, r.statusLabel, String(r.netPayable)]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || r.statusLabel === statusFilter;
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
