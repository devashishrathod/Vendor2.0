import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  BarChart3,
  Receipt,
  Layers,
  RefreshCw,
  LineChart,
  Trophy,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import useBrandData from "@/features/brand/hooks/useBrandData";
import { fetchVoucherTransactionOverview } from "@/features/transaction/services/transactionService";
import { getVouchers } from "@/features/voucher/services/voucher/VoucherService";
import Select from "../../../components/common/Select";

// ══════════════════════════════════════════════════════════════
// DATA GENERATION
// Deterministic (not random) so switching date range gives a
// consistent, explainable trend instead of jumping around.
// ══════════════════════════════════════════════════════════════

const RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

// Real calendar start/end dates for the selected range — everything below
// (the revenue trend, the recent-transactions filter) is driven off this
// same {from, to} pair so they all agree on what "Today"/"This Month" etc.
// actually mean.
function getRangeDates(key) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (key === "yesterday") {
    const day = new Date(startOfToday);
    day.setDate(day.getDate() - 1);
    return { from: day, to: day };
  }
  if (key === "week") {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - start.getDay()); // back to this week's Sunday
    return { from: start, to: startOfToday };
  }
  if (key === "month") {
    return { from: new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1), to: startOfToday };
  }
  if (key === "year") {
    return { from: new Date(startOfToday.getFullYear(), 0, 1), to: startOfToday };
  }
  // "today"
  return { from: startOfToday, to: startOfToday };
}

function isWithinRange(iso, range) {
  if (!iso) return false;
  const date = new Date(iso);
  const end = new Date(range.to);
  end.setHours(23, 59, 59, 999);
  return date >= range.from && date <= end;
}

// Real per-day aggregation of the actual voucher-claim payment rows
// (fetchVoucherTransactionOverview, same source Recent Transactions below
// uses) within the selected range — one bucket per calendar day, revenue/
// transactions/refunds summed from each row's real `amount`/`status`.
// Replaces a previous version that plotted a fabricated sine-wave trend
// with no connection to real data — this project has no generic "orders"
// concept at all (it's voucher redemptions), so there's nothing to
// simulate a trend FOR without the real rows.
function buildRealSeries(range, rows) {
  const { from, to } = range;
  const totalDays = Math.max(1, Math.round((to - from) / 86400000) + 1);
  const buckets = [];
  const cursor = new Date(from);
  for (let idx = 0; idx < totalDays; idx += 1) {
    buckets.push({
      date: new Date(cursor),
      label: cursor.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      fullLabel: cursor.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      revenue: 0,
      transactions: 0,
      refunds: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  rows.forEach((row) => {
    const iso = row.raw?.createdAt;
    if (!iso) return;
    const created = new Date(iso);
    const dayStart = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const dayIdx = Math.round((dayStart - from) / 86400000);
    if (dayIdx < 0 || dayIdx >= buckets.length) return;
    const amount = Number(row.raw?.amount || 0);
    buckets[dayIdx].revenue += amount;
    buckets[dayIdx].transactions += 1;
    // Real Razorpay status vocabulary (see transactionService.js's
    // mapPaymentRow comment) — "refunded" is a genuine, confirmed value.
    if (row.raw?.status === "refunded") buckets[dayIdx].refunds += amount;
  });
  return buckets;
}

function summarizeVoucherDiscount(offers) {
  const offer = offers?.[0];
  if (!offer) return "—";
  return offer.title || `${offer.discountValue}${offer.discountType === "PERCENTAGE" ? "%" : "₹"} OFF`;
}

// Real usage/trend for a "Top Performing Voucher" card, derived from the
// same real payment rows Recent Transactions uses (fetchVoucherTransactionOverview) —
// never a fabricated number. NOTE: the payment record only exposes the
// *parent* voucher's id as `voucherId` (see transactionService.js's refId
// comment), not this version's own `_id` — `v.voucher?._id` is the most
// likely match for that parent id based on the nested shape returned by
// GET /vouchers/versions/get-all, with `v._id`/`v.versionCode` tried as
// fallbacks since that relationship isn't confirmed by a pasted API sample.
// If none of these match anything, usage is genuinely unknown — shown as
// "—" rather than guessed.
function computeVoucherUsage(v, rows) {
  const candidates = [v.voucher?._id, v._id, v.versionCode].filter(Boolean);
  const matches = rows.filter((row) => candidates.includes(row.refId));
  if (matches.length === 0) return null;
  const sorted = [...matches].sort((a, b) => new Date(a.raw?.createdAt || 0) - new Date(b.raw?.createdAt || 0));
  const half = Math.floor(sorted.length / 2);
  const firstHalfCount = half;
  const secondHalfCount = sorted.length - half;
  const trend = firstHalfCount ? ((secondHalfCount - firstHalfCount) / firstHalfCount) * 100 : 0;
  return { count: matches.length, trend };
}

// "Recent Transactions" below is real data (GET /voucher-claims/payments,
// same source Transactions.jsx uses) — no more dummy TRANSACTIONS array.
// mapPaymentRow (inside fetchVoucherTransactionOverview) sets `status` to
// "Paid" for a captured payment, or the raw Razorpay status capitalized
// otherwise (Failed/Created/Authorized/...) — only Paid gets a dedicated
// style, everything else falls back to a neutral pending-ish look rather
// than guessing a color for statuses that were never confirmed.

// Same deterministic per-customer avatar color as TransactionOverview.jsx's
// table (this table is a like-for-like copy of that one).
const AVATAR_RING_COLORS = [
  { ring: "ring-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700" },
  { ring: "ring-rose-200", bg: "bg-rose-50", text: "text-rose-700" },
  { ring: "ring-amber-200", bg: "bg-amber-50", text: "text-amber-700" },
  { ring: "ring-sky-200", bg: "bg-sky-50", text: "text-sky-700" },
  { ring: "ring-violet-200", bg: "bg-violet-50", text: "text-violet-700" },
];

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColors(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_RING_COLORS[Math.abs(hash) % AVATAR_RING_COLORS.length];
}

function formatINR(n) {
  return `₹ ${Math.round(n).toLocaleString("en-IN")}`;
}

// Compact ₹1.2L / ₹90K style used on the Revenue Trend y-axis, matching the
// reference design instead of printing the full rupee figure at every tick.
function formatCompactINR(n) {
  const rounded = Math.round(n);
  if (rounded >= 100000) {
    const v = rounded / 100000;
    return `₹${v % 1 === 0 ? v : v.toFixed(1)}L`;
  }
  if (rounded >= 1000) {
    const v = rounded / 1000;
    return `₹${v % 1 === 0 ? v : v.toFixed(1)}K`;
  }
  return `₹${rounded}`;
}

// Downsample a series to at most `maxPoints` values, evenly spaced — keeps
// the stat-card sparklines smooth even when the selected range has 300+ days.
function sampleForSparkline(values, maxPoints = 12) {
  if (values.length <= maxPoints) return values;
  const step = values.length / maxPoints;
  return Array.from({ length: maxPoints }, (_, i) => values[Math.floor(i * step)]);
}

// Tiny trend line shown top-right of each stat card — plotted from the same
// series data the card's headline number is derived from (never fabricated).
function MiniSparkline({ data, color }) {
  const points = sampleForSparkline(data);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const step = w / (points.length - 1 || 1);
  const path = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// % change comparing the second half of the series vs the first half —
// a simple, honest trend signal instead of a hardcoded number.
function computeChange(series, key) {
  const half = Math.floor(series.length / 2);
  const first = series.slice(0, half).reduce((s, d) => s + d[key], 0) / (half || 1);
  const second = series.slice(half).reduce((s, d) => s + d[key], 0) / (series.length - half || 1);
  if (!first) return 0;
  return ((second - first) / first) * 100;
}

// Small Prev/page-numbers/Next bar shared by the Top Performing Voucher and
// Recent Transactions tables below — both paginate the same way (10 rows).
function PaginationBar({ page, totalPages, onChange, count }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors ${
              p === page ? "bg-emerald-500 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════

const CHART_METRICS = [
  { key: "revenue", label: "Revenue" },
  { key: "transactions", label: "Transactions" },
  { key: "aov", label: "Avg. Transaction Value" },
];

export default function AnalysisReport() {
  const [rangeKey, setRangeKey] = useState("month");
  const [hoveredDay, setHoveredDay] = useState(null);
  const [chartMetric, setChartMetric] = useState("revenue");
  const [transactionSearch, setTransactionSearch] = useState("");
  const voucherScrollRef = useRef(null);
  const scrollVouchers = (dir) => {
    voucherScrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  // "Recent Transactions" — real voucher claim payments, same
  // brandId-resolution pattern as Transactions.jsx (onboarding/auth store,
  // confirmed via GET /brands/get).
  const onboardingBrandId = useOnboardingStore((s) => s.formData.brandId);
  const authUserBrandId = useAuthStore((s) => s.user?.brandId);
  const candidateBrandId = onboardingBrandId || authUserBrandId;
  const { data: brand } = useBrandData(candidateBrandId);
  const resolvedBrandId = brand?._id || candidateBrandId;

  // "Vouchers" section below — real GET /vouchers/versions/get-all list,
  // same service the Voucher management page uses.
  const [vouchers, setVouchers] = useState([]);
  const [vouchersError, setVouchersError] = useState("");
  useEffect(() => {
    if (!resolvedBrandId) return;
    let cancelled = false;
    getVouchers({ brandId: resolvedBrandId, page: 1, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setVouchers(res?.data?.data ?? []);
        setVouchersError("");
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err.message || "Failed to load vouchers.";
        // Confirmed backend quirk: a brand with zero vouchers gets an
        // error-shaped response ("No any voucherversion found") instead of
        // a normal empty list — that's not a real failure, so it's treated
        // as "no vouchers yet" (the existing empty state below) rather
        // than shown as a raw red error message.
        if (/no.*voucher.*found/i.test(message)) {
          setVouchers([]);
          setVouchersError("");
        } else {
          setVouchersError(message);
        }
      });
    return () => { cancelled = true; };
  }, [resolvedBrandId]);

  const [transactionRows, setTransactionRows] = useState([]);
  const [transactionsError, setTransactionsError] = useState("");
  const [transactionPage, setTransactionPage] = useState(1);
  useEffect(() => {
    if (!resolvedBrandId) return;
    let cancelled = false;
    fetchVoucherTransactionOverview({ brandId: resolvedBrandId })
      .then((result) => {
        if (cancelled) return;
        setTransactionRows(result.rows);
        setTransactionsError("");
      })
      .catch((err) => setTransactionsError(err.message || "Failed to load transactions."));
    return () => { cancelled = true; };
  }, [resolvedBrandId]);

  // Changing the top date filter re-slices which transactions match, so
  // whatever page you were on may no longer exist — back to page 1.
  const changeRange = (key) => {
    setRangeKey(key);
    setTransactionPage(1);
  };

  const range = RANGE_OPTIONS.find((r) => r.key === rangeKey);
  const rangeDates = useMemo(() => getRangeDates(rangeKey), [rangeKey]);

  // Every KPI/chart/status-split below is derived from this SAME
  // range-filtered set of real rows, so the top summary and the Recent
  // Transactions table further down always agree — matches Transactions.jsx's
  // convention of never disagreeing with its own table.
  const rangeTransactionRows = useMemo(
    () => transactionRows.filter((row) => isWithinRange(row.raw?.createdAt, rangeDates)),
    [transactionRows, rangeDates]
  );
  const series = useMemo(
    () => buildRealSeries(rangeDates, rangeTransactionRows),
    [rangeDates, rangeTransactionRows]
  );

  // ── Derived KPIs (recompute whenever the date range or real data changes) ──
  const totalRevenue = series.reduce((s, d) => s + d.revenue, 0);
  const totalTransactions = series.reduce((s, d) => s + d.transactions, 0);
  const avgTransactionValue = totalTransactions ? totalRevenue / totalTransactions : 0;
  const refundsIssued = series.reduce((s, d) => s + d.refunds, 0);

  const revenueChange = computeChange(series, "revenue");
  const transactionsChange = computeChange(series, "transactions");
  const refundsChange = computeChange(series, "refunds");

  const STATS = [
    {
      label: "Total Revenue",
      value: formatINR(totalRevenue),
      change: revenueChange,
      icon: BarChart3,
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
      iconText: "text-emerald-600 dark:text-emerald-400",
      spark: "#10b981",
      sparkData: series.map((d) => d.revenue),
    },
    {
      label: "Total Transactions",
      value: totalTransactions.toLocaleString("en-IN"),
      change: transactionsChange,
      icon: Receipt,
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      spark: "#3b82f6",
      sparkData: series.map((d) => d.transactions),
    },
    {
      label: "Avg Transaction Value",
      value: formatINR(avgTransactionValue),
      change: revenueChange - transactionsChange, // drifts with the gap between the two
      icon: Layers,
      iconBg: "bg-violet-50",
      iconText: "text-violet-600",
      spark: "#8b5cf6",
      sparkData: series.map((d) => (d.transactions ? d.revenue / d.transactions : 0)),
    },
    {
      label: "Refunds Issued",
      value: formatINR(refundsIssued),
      change: refundsChange,
      icon: RefreshCw,
      iconBg: "bg-rose-50",
      iconText: "text-rose-500",
      spark: "#f43f5e",
      sparkData: series.map((d) => d.refunds),
    },
  ];

  // ── Revenue Trend chart data for whichever metric tab is selected ──
  const metricSeriesValues = series.map((d) =>
    chartMetric === "transactions" ? d.transactions : chartMetric === "aov" ? (d.transactions ? d.revenue / d.transactions : 0) : d.revenue
  );
  const maxMetric = Math.max(...metricSeriesValues, 1);
  const yTicks = [maxMetric, maxMetric * 0.75, maxMetric * 0.5, maxMetric * 0.25, 0];
  const labelStep = Math.max(1, Math.round(series.length / 6));
  const formatMetricValue = (n) =>
    chartMetric === "transactions" ? `${Math.round(n).toLocaleString("en-IN")} transactions` : formatINR(n);

  // ── Transaction status split — real distribution of `rangeTransactionRows`'
  // own `status` (see transactionService.js's mapPaymentRow: "Paid" for a
  // captured payment, else the raw Razorpay status capitalized — Failed/
  // Refunded/Created/Authorized — or "Pending" as a last-resort fallback),
  // not a fabricated percentage breakdown.
  const STATUS_SPLIT_COLORS = {
    Paid: "#34d399",
    Refunded: "#f87171",
    Failed: "#9ca3af",
  };
  const DEFAULT_STATUS_COLOR = "#fbbf24"; // Pending / Created / Authorized / anything else
  const statusCounts = rangeTransactionRows.reduce((acc, row) => {
    const label = row.status || "Pending";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const statusSplit = Object.entries(statusCounts)
    .map(([label, count]) => ({
      label,
      count,
      pct: totalTransactions ? Math.round((count / totalTransactions) * 1000) / 10 : 0,
      color: STATUS_SPLIT_COLORS[label] || DEFAULT_STATUS_COLOR,
    }))
    .sort((a, b) => b.count - a.count);
  let acc = 0;
  const conicStops = statusSplit.length
    ? statusSplit
        .map((s) => {
          const from = acc;
          acc += s.pct;
          return `${s.color} ${from}% ${acc}%`;
        })
        .join(", ")
    : "#e5e7eb 0% 100%";

  // ── Vouchers: only PUBLISHED ones show here ("Top Performing" means live
  // for customers), ranked by real usage against Recent Transactions' rows. ──
  const PAGE_SIZE = 10;
  const filteredVouchers = vouchers.filter((v) => v.status === "PUBLISHED");
  const topVouchers = filteredVouchers
    .map((v) => ({ v, usage: computeVoucherUsage(v, transactionRows) }))
    .sort((a, b) => (b.usage?.count || 0) - (a.usage?.count || 0));

  // ── Recent Transactions: same range-filtered rows the KPIs/chart/status
  // split above use, plus a client-side search (order id / customer /
  // voucher version id), then paginated 10 at a time. ──
  const transactionSearchTerm = transactionSearch.trim().toLowerCase();
  const filteredTransactionRows = rangeTransactionRows.filter((row) =>
    !transactionSearchTerm ||
    [row.orderId, row.customerName, row.customerCode, row.refId]
      .join(" ")
      .toLowerCase()
      .includes(transactionSearchTerm)
  );
  const transactionTotalPages = Math.max(1, Math.ceil(filteredTransactionRows.length / PAGE_SIZE));
  const pagedTransactionRows = filteredTransactionRows.slice(
    (transactionPage - 1) * PAGE_SIZE,
    transactionPage * PAGE_SIZE
  );

  const exportCSV = () => {
    const header = "Voucher Name,Status,Valid From,Valid Till,Discount\n";
    const rows = filteredVouchers
      .map((v) => `"${v.name}","${v.status}","${v.startAt || ""}","${v.endAt || ""}","${summarizeVoucherDiscount(v.offers)}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vouchers-${rangeKey}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen dark:bg-gray-900 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* ── Heading + controls ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">
              Business performance overview · {range.label.toLowerCase()} view
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 rounded-xl px-3 py-2">
              <CalendarDays size={14} className="text-gray-400" />
              <Select
                compact
                value={rangeKey}
                onChange={changeRange}
                options={RANGE_OPTIONS.map((r) => ({ value: r.key, label: r.label }))}
                className="bg-transparent text-gray-700 dark:text-gray-300"
              />
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-emerald-700 transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {STATS.map((s) => {
            const positive = s.change >= 0;
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg} ${s.iconText}`}>
                      <Icon size={18} />
                    </div>
                    <p className="text-xs text-gray-400 font-medium truncate">{s.label}</p>
                  </div>
                  <MiniSparkline data={s.sparkData} color={s.spark} />
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-3">{s.value}</p>
                <p className={`flex items-center gap-1 text-xs font-semibold mt-1 ${positive ? "text-emerald-600" : "text-red-500"}`}>
                  {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(s.change).toFixed(1)}% vs prev period
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Revenue Trend + Order Status, side by side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <LineChart size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue Trend</p>
                <p className="text-[11px] text-gray-400">Your revenue performance over time</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {CHART_METRICS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setChartMetric(m.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                      chartMetric === m.key ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                Daily <ChevronDown size={13} className="text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatINR(totalRevenue)}</p>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                revenueChange >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}
            >
              {revenueChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(revenueChange).toFixed(1)}% vs prev. period
            </span>
          </div>

          <div className="flex gap-2">
            {/* Y-axis */}
            <div className="flex flex-col justify-between text-[10px] text-gray-400 h-52 pb-5 pt-1 text-right w-10 shrink-0">
              {yTicks.map((t, i) => (
                <span key={i}>{formatCompactINR(t)}</span>
              ))}
            </div>

            <div className="flex-1 relative">
              {/* Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pb-5 pt-1 pointer-events-none">
                {yTicks.map((_, i) => (
                  <div key={i} />
                ))}
              </div>

              {/* Floating tooltip */}
              {hoveredDay !== null && (
                <div
                  className="absolute z-10 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-1.5 whitespace-nowrap pointer-events-none"
                  style={{
                    left: `${((hoveredDay + 0.5) / series.length) * 100}%`,
                    bottom: `${Math.min(88, (metricSeriesValues[hoveredDay] / maxMetric) * 78 + 12)}%`,
                  }}
                >
                  <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-100">{series[hoveredDay].fullLabel}</p>
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {formatMetricValue(metricSeriesValues[hoveredDay])}
                  </p>
                </div>
              )}

              <div className="relative flex items-end gap-[3px] h-52 pb-5" onMouseLeave={() => setHoveredDay(null)}>
                {series.map((d, i) => {
                  const isHovered = hoveredDay === i;
                  return (
                    <div
                      key={i}
                      className="flex-1 h-full flex items-end cursor-pointer group"
                      onMouseEnter={() => setHoveredDay(i)}
                    >
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{
                          height: `${Math.max(2, (metricSeriesValues[i] / maxMetric) * 100)}%`,
                          background: isHovered ? "#059669" : "linear-gradient(180deg, #34d399, #a7f3d0)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid mt-1 text-[10px] text-gray-400" style={{ gridTemplateColumns: `repeat(${series.length}, 1fr)` }}>
                {series.map((d, i) => {
                  const showLabel = i === 0 || i === series.length - 1 || i % labelStep === 0;
                  return (
                    <span key={i} className="text-center truncate">
                      {showLabel ? d.label : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Transaction status donut ── */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Layers size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction Status</p>
                <p className="text-[11px] text-gray-400">Total transactions: {totalTransactions.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <Link
              to="/transactions"
              className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap"
            >
              View Details <ChevronRight size={13} />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div
              className="w-36 h-36 rounded-full shrink-0 relative"
              style={{ background: `conic-gradient(${conicStops})` }}
            >
              <div className="absolute inset-[14px] bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalTransactions.toLocaleString("en-IN")}</span>
                <span className="text-[10px] text-gray-400">Transactions</span>
              </div>
            </div>
            <div className="flex-1 w-full flex flex-col gap-3.5">
              {statusSplit.length === 0 ? (
                <p className="text-xs text-gray-400">No transactions in this period yet.</p>
              ) : (
                statusSplit.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                      {s.count.toLocaleString("en-IN")}
                      <span className="text-gray-400 font-normal"> ({s.pct}%)</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className={`mt-5 flex items-center gap-3 rounded-xl px-4 py-3 ${
              revenueChange >= 0 ? "bg-emerald-50" : "bg-amber-50"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg text-white flex items-center justify-center shrink-0 ${
                revenueChange >= 0 ? "bg-emerald-500" : "bg-amber-500"
              }`}
            >
              <Trophy size={16} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${revenueChange >= 0 ? "text-emerald-800" : "text-amber-800"}`}>
                {revenueChange >= 0 ? "Great Performance!" : "Heads up"}
              </p>
              <p className={`text-xs ${revenueChange >= 0 ? "text-emerald-600" : "text-amber-700"}`}>
                {revenueChange >= 0
                  ? `Your revenue is up by ${revenueChange.toFixed(1)}% this month.`
                  : `Your revenue is down by ${Math.abs(revenueChange).toFixed(1)}% this month.`}
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* ── Top Performing Voucher: horizontal card carousel, ranked by real usage ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl mb-4">
          <div className="flex items-center justify-between px-5 py-3.5 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Star size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Top Performing Voucher</p>
                <p className="text-[11px] text-gray-400">Your best performing offers this month</p>
              </div>
            </div>
            <Link
              to="/vouchers"
              className="flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold text-emerald-600 hover:underline"
            >
              View All <ChevronRight size={13} />
            </Link>
          </div>

          <div className="relative px-5 py-4">
            {vouchersError ? (
              <p className="text-center text-sm text-rose-500 py-6">{vouchersError}</p>
            ) : topVouchers.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No published vouchers yet.</p>
            ) : (
              <>
                <button
                  onClick={() => scrollVouchers(-1)}
                  aria-label="Scroll left"
                  className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow items-center justify-center text-gray-500 hover:text-gray-800"
                >
                  <ChevronLeft size={16} />
                </button>

                <div
                  ref={voucherScrollRef}
                  className="flex gap-3 overflow-x-auto scroll-smooth snap-x px-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {topVouchers.map(({ v, usage }) => {
                    const thumbnail = v.images?.[0]?.url;
                    // Confirmed shape (vendor_panel_api_doc.md #59, V-4):
                    // banner.current.{url,kind} — only usable here as an
                    // <img> fallback when it isn't a video.
                    const currentBanner = v.voucher?.banner?.current;
                    const bannerUrl = currentBanner && currentBanner.kind !== "VIDEO" ? currentBanner.url : null;
                    const imageUrl = thumbnail || bannerUrl;
                    return (
                      <div
                        key={v._id}
                        className="flex-none w-64 bg-gray-50 dark:bg-gray-700 rounded-xl p-3 snap-start"
                      >
                        <div className="flex gap-3">
                          {imageUrl ? (
                            <img src={imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg flex items-center justify-center text-gray-300 shrink-0">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="inline-block bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold px-2 py-0.5 rounded-full mb-1">
                              {summarizeVoucherDiscount(v.offers)}
                            </span>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">{v.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{v.versionCode}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2">
                          <span className="text-xs text-gray-500">
                            {usage ? `${usage.count.toLocaleString("en-IN")} uses` : "No uses yet"}
                          </span>
                          {usage && usage.count >= 2 && (
                            <span
                              className={`flex items-center gap-0.5 text-xs font-semibold ${
                                usage.trend >= 0 ? "text-emerald-600" : "text-red-500"
                              }`}
                            >
                              {usage.trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {Math.abs(usage.trend).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => scrollVouchers(1)}
                  aria-label="Scroll right"
                  className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow items-center justify-center text-gray-500 hover:text-gray-800"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Recent transactions ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 gap-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Recent Transactions</p>
            <div className="relative w-full max-w-[220px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={transactionSearch}
                onChange={(e) => { setTransactionSearch(e.target.value); setTransactionPage(1); }}
                placeholder="Search transactions…"
                className="w-full text-xs rounded-lg pl-7 pr-3 py-1.5 outline-none bg-emerald-50 dark:bg-emerald-500/10 text-gray-700 dark:text-gray-100 placeholder:text-gray-400"
              />
            </div>
          </div>
          {transactionsError && (
            <p className="px-5 py-2.5 text-xs text-rose-600 bg-rose-50">
              {transactionsError}
            </p>
          )}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1a1a2e]">
                  {[
                    "Order Id", "Customer detail", "Voucher Version ID", "Created on", "Outlet Store ID",
                    "Bill Amount", "Offer Discount", "Net Bill", "Paid Amount", "Payment Method", "Status",
                  ].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/80 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTransactionRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-gray-400">
                      {transactionSearch
                        ? `No transactions match "${transactionSearch}".`
                        : `No transactions for ${range.label.toLowerCase()}.`}
                    </td>
                  </tr>
                ) : (
                  pagedTransactionRows.map((row) => {
                    const avatar = getAvatarColors(row.customerName);
                    return (
                      <tr key={row.orderId} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Link
                            to={`/transactions/order/${(row.txnId || row.orderId).replace(/^#/, "")}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            {row.orderId}
                          </Link>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ring-1 flex-shrink-0
                                ${avatar.bg} ${avatar.text} ${avatar.ring}`}
                            >
                              {getInitials(row.customerName)}
                            </div>
                            <div>
                              <p className="text-gray-700 dark:text-gray-300 font-medium capitalize">{row.customerName}</p>
                              <p className="text-blue-500">{row.customerCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.refId}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.createdOn}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.outlet}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.billAmount}</td>
                        <td className="px-3 py-2 text-rose-500 whitespace-nowrap">{row.offerDiscount}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.netBill}</td>
                        <td className="px-3 py-2 text-green-700 font-medium whitespace-nowrap">{row.amount}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap capitalize">{row.paymentMethod}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
                              ${row.status === "Paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-amber-700"
                              }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={transactionPage}
            totalPages={transactionTotalPages}
            onChange={setTransactionPage}
            count={filteredTransactionRows.length}
          />
        </div>

      </div>
    </div>
  );
}