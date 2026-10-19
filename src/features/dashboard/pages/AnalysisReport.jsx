import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  LayoutGrid,
  Sparkles,
  Search,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
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
import AnimatedNumber from "@/components/common/AnimatedNumber";
import DonutChart from "@/components/charts/DonutChart";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import TrendAreaChart from "@/components/charts/TrendAreaChart";
import Select from "../../../components/common/Select";
import ActionCenter from "../components/ActionCenter";
import PlanUsageCard from "../components/PlanUsageCard";
import QuickActions from "../components/QuickActions";
import SettlementSnapshot from "../components/SettlementSnapshot";
import VoucherTicketCard from "../components/VoucherTicketCard";
import useDashboardInsights from "../hooks/useDashboardInsights";

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

// Revenue Trend's own period filter, independent of the page-level range:
// Daily/Yesterday plot 24 hourly bars, Weekly/Monthly one bar per day over
// the last 7/30 days, and 3 Months one bar per week.
const CHART_PERIOD_OPTIONS = [
  { value: "daily", label: "Daily", short: "1D" },
  { value: "yesterday", label: "Yesterday", short: "Yest" },
  { value: "weekly", label: "Weekly", short: "7D" },
  { value: "monthly", label: "Monthly", short: "30D" },
  { value: "3months", label: "3 Months", short: "3M" },
];

function getChartPeriodDates(key) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysBack = (n) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - n);
    return d;
  };

  if (key === "yesterday") return { from: daysBack(1), to: daysBack(1) };
  if (key === "weekly") return { from: daysBack(6), to: startOfToday };
  if (key === "monthly") return { from: daysBack(29), to: startOfToday };
  if (key === "3months") {
    const from = new Date(startOfToday);
    from.setMonth(from.getMonth() - 3);
    from.setDate(from.getDate() + 1);
    return { from, to: startOfToday };
  }
  // "daily" — today
  return { from: startOfToday, to: startOfToday };
}

// 24 hourly buckets for a single day, built from the same real payment rows
// as buildRealSeries — used by the chart's Daily/Yesterday periods.
function buildHourlySeries(day, rows) {
  const dayLabel = day.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const pad = (h) => String(h).padStart(2, "0");
  const buckets = Array.from({ length: 24 }, (_, h) => ({
    date: new Date(day.getFullYear(), day.getMonth(), day.getDate(), h),
    label: `${pad(h)}:00`,
    fullLabel: `${dayLabel}, ${pad(h)}:00 – ${pad((h + 1) % 24)}:00`,
    revenue: 0,
    transactions: 0,
    refunds: 0,
  }));
  rows.forEach((row) => {
    const iso = row.raw?.createdAt;
    if (!iso) return;
    const created = new Date(iso);
    if (
      created.getFullYear() !== day.getFullYear() ||
      created.getMonth() !== day.getMonth() ||
      created.getDate() !== day.getDate()
    ) return;
    const bucket = buckets[created.getHours()];
    const amount = Number(row.raw?.amount || 0);
    bucket.revenue += amount;
    bucket.transactions += 1;
    if (row.raw?.status === "refunded") bucket.refunds += amount;
  });
  return buckets;
}

// Rolls the per-day series up into Sunday-start weeks (same week boundary
// getRangeDates' "This Week" uses) for the Revenue Trend's 3 Months view. The
// first/last week are clipped to the selected range, so their labels show
// the real days covered rather than a full calendar week.
function groupSeriesByWeek(series) {
  const weeks = [];
  series.forEach((day) => {
    const last = weeks[weeks.length - 1];
    if (!last || day.date.getDay() === 0) {
      weeks.push({ start: day.date, end: day.date, revenue: 0, transactions: 0, refunds: 0 });
    }
    const week = weeks[weeks.length - 1];
    week.end = day.date;
    week.revenue += day.revenue;
    week.transactions += day.transactions;
    week.refunds += day.refunds;
  });
  const fmt = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return weeks.map((w) => ({
    date: w.start,
    label: fmt(w.start),
    fullLabel: `${fmt(w.start)} – ${fmt(w.end)} ${w.end.getFullYear()}`,
    revenue: w.revenue,
    transactions: w.transactions,
    refunds: w.refunds,
  }));
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

// Full-width area sparkline along the bottom of a bento stat card — plotted
// from the same series the card's headline number is derived from (never
// fabricated). Stretches to the card width via preserveAspectRatio="none".
function SparkArea({ data, color, id }) {
  const points = sampleForSparkline(data, 16);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 100;
  const h = 36;
  const step = w / (points.length - 1 || 1);
  const coords = points.map((v, i) => [i * step, h - 2 - ((v - min) / range) * (h - 6)]);
  // Midpoint-smoothed curve so the line reads like the chart above it.
  const line = coords.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = coords[i - 1];
    const mx = (px + x) / 2;
    return `${d} C ${mx} ${py}, ${mx} ${y}, ${x} ${y}`;
  }, "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-14 w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

// Mini column chart for a bento stat card (same real series, sampled).
function SparkBars({ data, color }) {
  const points = sampleForSparkline(data, 14);
  const max = Math.max(...points) || 1;
  return (
    <div className="flex h-14 items-end gap-1">
      {points.map((v, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-md transition-all duration-700"
          style={{ height: `${Math.max(8, (v / max) * 100)}%`, backgroundColor: color, opacity: v ? 0.85 : 0.2 }}
        />
      ))}
    </div>
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
  const [chartMetric, setChartMetric] = useState("revenue");
  const [chartPeriod, setChartPeriod] = useState("weekly");
  const [transactionSearch, setTransactionSearch] = useState("");
  const voucherScrollRef = useRef(null);
  const scrollVouchers = (dir) => {
    voucherScrollRef.current?.scrollBy({ left: dir * 332, behavior: "smooth" });
  };

  // Left/right arrows only show when the voucher row actually overflows —
  // left once scrolled away from the start, right until the end is reached.
  const [voucherScroll, setVoucherScroll] = useState({ left: false, right: false });
  const updateVoucherScroll = useCallback(() => {
    const el = voucherScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setVoucherScroll({ left: el.scrollLeft > 4, right: el.scrollLeft < maxScroll - 4 });
  }, []);

  // "Recent Transactions" — real voucher claim payments, same
  // brandId-resolution pattern as Transactions.jsx (onboarding/auth store,
  // confirmed via GET /brands/get).
  const onboardingBrandId = useOnboardingStore((s) => s.formData.brandId);
  const authUserBrandId = useAuthStore((s) => s.user?.brandId);
  const candidateBrandId = onboardingBrandId || authUserBrandId;
  const { data: brand } = useBrandData(candidateBrandId);
  const resolvedBrandId = brand?._id || candidateBrandId;

  // Settlements, open refunds and the current plan — feed the Action
  // Center, Settlements and Plan Usage cards.
  const insights = useDashboardInsights(resolvedBrandId, brand);

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

  // Re-check overflow whenever the row's size or content changes (the
  // observer also fires once right after observe(), covering first paint).
  useEffect(() => {
    const el = voucherScrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(updateVoucherScroll);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [vouchers, updateVoucherScroll]);

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
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

  // Real counts off the same range-filtered rows — "Paid" share drives the
  // Transactions card's progress bar, refunded count the Refunds badge.
  const paidCount = rangeTransactionRows.filter((row) => row.status === "Paid").length;
  const paidPct = totalTransactions ? Math.round((paidCount / totalTransactions) * 100) : 0;
  const refundedCount = rangeTransactionRows.filter((row) => row.raw?.status === "refunded").length;
  const openRefunds = (insights.refunds.data || []).length;

  // Bento stat cards. `visual` picks what sits along the card's bottom edge:
  // an area sparkline, a progress bar, or mini columns.
  const STATS = [
    {
      label: "Total Revenue",
      value: totalRevenue,
      format: formatINR,
      change: revenueChange,
      icon: BarChart3,
      iconBg: "bg-white dark:bg-emerald-500/15",
      iconText: "text-emerald-600 dark:text-emerald-400",
      color: "var(--color-emerald-500)",
      visual: "area",
      data: series.map((d) => d.revenue),
      to: "/transactions",
      highlight: true,
    },
    {
      label: "Total Transactions",
      value: totalTransactions,
      format: (n) => Math.round(n).toLocaleString("en-IN"),
      change: transactionsChange,
      icon: Receipt,
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
      iconText: "text-emerald-600 dark:text-emerald-400",
      sub: `${paidPct}% paid successfully`,
      visual: "progress",
      progress: paidPct,
    },
    {
      label: "Avg Transaction Value",
      value: avgTransactionValue,
      format: formatINR,
      change: revenueChange - transactionsChange, // drifts with the gap between the two
      icon: Layers,
      iconBg: "bg-amber-50 dark:bg-amber-500/10",
      iconText: "text-amber-500",
      color: "#f59e0b",
      visual: "bars",
      data: series.map((d) => (d.transactions ? d.revenue / d.transactions : 0)),
    },
    {
      label: "Refunds Issued",
      value: refundsIssued,
      format: formatINR,
      change: refundsChange,
      // More refunds is bad news — flip the colour of the change line.
      invertChange: true,
      icon: RefreshCw,
      iconBg: "bg-sky-50 dark:bg-sky-500/10",
      iconText: "text-sky-500",
      color: "#0ea5e9",
      visual: "area",
      data: series.map((d) => d.refunds),
      badge: `${refundedCount} refund${refundedCount === 1 ? "" : "s"}`,
    },
  ];

  // ── Revenue Trend chart data for whichever metric tab + chart period is
  // selected. The chart has its own period filter, so its header total and
  // change badge come from chartSeries, not the page-level KPIs. ──
  const chartSeries = useMemo(() => {
    const periodDates = getChartPeriodDates(chartPeriod);
    const periodRows = transactionRows.filter((row) => isWithinRange(row.raw?.createdAt, periodDates));
    if (chartPeriod === "daily" || chartPeriod === "yesterday") {
      return buildHourlySeries(periodDates.from, periodRows);
    }
    const daily = buildRealSeries(periodDates, periodRows);
    return chartPeriod === "3months" ? groupSeriesByWeek(daily) : daily;
  }, [chartPeriod, transactionRows]);
  const chartTotalRevenue = chartSeries.reduce((s, d) => s + d.revenue, 0);
  const chartRevenueChange = computeChange(chartSeries, "revenue");
  const chartData = chartSeries.map((d) => ({
    label: d.label,
    fullLabel: d.fullLabel,
    value:
      chartMetric === "transactions" ? d.transactions : chartMetric === "aov" ? (d.transactions ? d.revenue / d.transactions : 0) : d.revenue,
  }));
  const formatMetricValue = (n) =>
    chartMetric === "transactions" ? `${Math.round(n).toLocaleString("en-IN")} transactions` : formatINR(n);

  // ── Transaction status split — real distribution of `rangeTransactionRows`'
  // own `status` (see transactionService.js's mapPaymentRow: "Paid" for a
  // captured payment, else the raw Razorpay status capitalized — Failed/
  // Refunded/Created/Authorized — or "Pending" as a last-resort fallback),
  // not a fabricated percentage breakdown.
  const STATUS_SPLIT_COLORS = {
    Paid: "var(--color-emerald-400)",
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
  // ── Vouchers: only PUBLISHED ones show here ("Top Performing" means live
  // for customers), ranked by real usage against Recent Transactions' rows. ──
  const PAGE_SIZE = 10;
  const filteredVouchers = vouchers.filter((v) => v.status === "PUBLISHED");
  const topVouchers = filteredVouchers
    .map((v) => ({ v, usage: computeVoucherUsage(v, transactionRows) }))
    .sort((a, b) => (b.usage?.count || 0) - (a.usage?.count || 0));

  // Top 5 vouchers by real use count — only ones with at least one matched
  // payment, so the ranking chart never shows guessed zeros as "data".
  const topVoucherChartData = topVouchers
    .filter(({ usage }) => usage?.count)
    .slice(0, 5)
    .map(({ v, usage }) => ({ label: v.name || v.versionCode, value: usage.count }));

  // Revenue per outlet in the selected range, from each payment row's real
  // outlet store id (mapPaymentRow's `outlet`; "—" when the payment has no
  // outlet attached, which is left out rather than shown as an outlet).
  const outletChartData = Object.entries(
    rangeTransactionRows.reduce((acc, row) => {
      if (!row.outlet || row.outlet === "—") return acc;
      acc[row.outlet] = (acc[row.outlet] || 0) + Number(row.raw?.amount || 0);
      return acc;
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

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
    <div className="min-h-screen font-sans">
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-8">

        {/* ── Heading + controls ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Sits on DashboardLayout's green hero wash — white text. */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white capitalize">
              {greeting}{brand?.brandName ? `, ${brand.brandName}` : ""}
            </h1>
            <p className="text-sm font-medium text-gray-600 mt-1 dark:text-white/75">
              Track your business performance · {range.label.toLowerCase()} view
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 shadow-sm dark:bg-gray-800/80">
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 shadow-sm text-xs font-semibold text-emerald-700 dark:bg-gray-800/80 dark:text-emerald-300 hover:bg-white transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Bento stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {STATS.map((s) => {
            const up = s.change >= 0;
            const good = s.invertChange ? !up : up;
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`bento-card relative flex flex-col overflow-hidden p-5 transition-transform duration-200 hover:-translate-y-0.5 ${
                  s.highlight
                    ? "bg-gradient-to-br from-emerald-100/90 via-white/70 to-white/60 dark:from-emerald-500/15 dark:via-gray-800/60 dark:to-gray-800/60"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${s.iconBg} ${s.iconText}`}>
                    <Icon size={18} />
                  </div>
                  {s.to ? (
                    <Link to={s.to} aria-label={`Open ${s.label}`} className="text-gray-400 transition-colors hover:text-emerald-600">
                      <ArrowUpRight size={16} />
                    </Link>
                  ) : s.badge ? (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                      {s.badge}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
                <AnimatedNumber
                  value={s.value}
                  format={s.format}
                  className="mt-1 block text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  {s.sub ?? (
                    <>
                      <span className={`inline-flex items-center gap-0.5 font-semibold ${good ? "text-emerald-600" : "text-rose-500"}`}>
                        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {up ? "+" : "-"}{Math.abs(s.change).toFixed(1)}%
                      </span>
                      vs prev period
                    </>
                  )}
                </p>

                <div className="mt-auto pt-4">
                  {s.visual === "area" && <SparkArea data={s.data} color={s.color} id={`spark-${s.label.replace(/\s+/g, "")}`} />}
                  {s.visual === "bars" && <SparkBars data={s.data} color={s.color} />}
                  {s.visual === "progress" && (
                    <div className="flex h-14 items-end">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000"
                          style={{ width: `${s.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bento row: Revenue Trend · Transaction Status · growth hero ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bento-card md:col-span-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
                <LineChart size={18} className="text-emerald-500" />
                Revenue Trend
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {formatINR(chartTotalRevenue)} ·{" "}
                <span className={chartRevenueChange >= 0 ? "text-emerald-600" : "text-rose-500"}>
                  {chartRevenueChange >= 0 ? "+" : "-"}{Math.abs(chartRevenueChange).toFixed(1)}%
                </span>{" "}
                vs prev. period
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-white/80 p-1 shadow-sm dark:bg-gray-900/40">
              {CHART_PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setChartPeriod(p.value)}
                  title={p.label}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    chartPeriod === p.value
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                  }`}
                >
                  {p.short}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {CHART_METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setChartMetric(m.key)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  chartMetric === m.key
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
                    : "text-gray-500 hover:bg-white/80 dark:text-gray-400 dark:hover:bg-gray-700/50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <TrendAreaChart
            data={chartData}
            dataKey="value"
            tooltipLabelKey="fullLabel"
            name={CHART_METRICS.find((m) => m.key === chartMetric)?.label}
            color={chartMetric === "transactions" ? "#3b82f6" : chartMetric === "aov" ? "#8b5cf6" : "var(--color-emerald-500)"}
            formatValue={formatMetricValue}
            formatAxis={chartMetric === "transactions" ? (n) => Math.round(n).toLocaleString("en-IN") : formatCompactINR}
            animationKey={`${chartMetric}-${chartPeriod}`}
          />
        </div>

        {/* ── Transaction status donut ── */}
        <div className="bento-card flex flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
                <LayoutGrid size={17} className="text-emerald-500" />
                Transaction Status
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Payments by current state · {range.label.toLowerCase()}</p>
            </div>
            <Link to="/transactions" aria-label="View transactions" className="text-gray-400 transition-colors hover:text-emerald-600">
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="my-5 flex justify-center">
            <DonutChart
              size={164}
              data={statusSplit.map((s) => ({ label: s.label, value: s.count, color: s.color }))}
              centerValue={<AnimatedNumber value={totalTransactions} />}
              centerLabel="Transactions"
              formatValue={(n) => `${n.toLocaleString("en-IN")} transactions`}
            />
          </div>

          <div className="mt-auto">
            {statusSplit.length === 0 ? (
              <p className="rounded-2xl bg-white/70 px-3 py-3 text-center text-xs text-gray-400 dark:bg-gray-900/40">
                No transactions in this period yet.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {statusSplit.slice(0, 3).map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white/80 px-2 py-2.5 text-center shadow-sm dark:bg-gray-900/40">
                    <p className="flex items-center justify-center gap-1.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </p>
                    <p className="mt-1 text-base font-bold text-gray-900 dark:text-gray-100">{s.count.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-gray-400">{Math.round(s.pct)}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Growth hero (green) ── */}
        <div className="relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-400 p-6 text-white shadow-[0_12px_40px_rgba(16,185,129,0.35)] dark:from-emerald-600 dark:to-teal-600 dark:shadow-none">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-white/10" />

          <p className="relative flex items-center gap-2 text-lg font-bold">
            {totalTransactions === 0 ? <Sparkles size={18} /> : revenueChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            {totalTransactions === 0 ? "Ready For Sales" : revenueChange >= 0 ? "Revenue Is Growing" : "Revenue Dipped"}
          </p>
          <p className="relative mt-2 text-sm leading-relaxed text-white/85">
            {totalTransactions === 0
              ? `No payments ${range.label.toLowerCase()} yet. Share your vouchers to get the first one.`
              : `Revenue ${revenueChange >= 0 ? "up" : "down"} ${Math.abs(revenueChange).toFixed(1)}% vs the previous period · ${range.label.toLowerCase()}.`}
          </p>

          <div className="relative mt-5 grid grid-cols-3 gap-2">
            {[
              { value: totalTransactions.toLocaleString("en-IN"), label: "Sales" },
              { value: `${paidPct}%`, label: "Paid" },
              { value: openRefunds.toLocaleString("en-IN"), label: "Refunds" },
            ].map((chip) => (
              <div key={chip.label} className="rounded-2xl bg-white/15 px-2 py-2.5 text-center backdrop-blur-sm ring-1 ring-white/20">
                <p className="text-lg font-bold leading-tight">{chip.value}</p>
                <p className="text-[11px] text-white/80">{chip.label}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-auto pt-6">
            <Link
              to="/transactions"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-transform hover:translate-x-0.5"
            >
              Overview <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="mb-4">
          <QuickActions />
        </div>

        {/* ── Action center + settlements + plan usage ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <ActionCenter
            refunds={insights.refunds.data || []}
            subscription={insights.subscription.data}
            brand={brand}
            loading={insights.refunds.loading || insights.subscription.loading}
          />
          <SettlementSnapshot
            settlements={insights.settlements.data || []}
            loading={insights.settlements.loading}
            error={insights.settlements.error}
          />
          <PlanUsageCard
            subscription={insights.subscription.data}
            loading={insights.subscription.loading}
            error={insights.subscription.error}
          />
        </div>

        {/* ── Rankings: top vouchers by uses + revenue by outlet ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bento-card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Trophy size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Top Vouchers</p>
                <p className="text-[11px] text-gray-400">Ranked by number of uses</p>
              </div>
            </div>
            {topVoucherChartData.length ? (
              <HorizontalBarChart
                data={topVoucherChartData}
                color="#f59e0b"
                name="Uses"
                formatValue={(n) => Math.round(n).toLocaleString("en-IN")}
              />
            ) : (
              <p className="py-8 text-center text-xs text-gray-400">No voucher uses yet.</p>
            )}
          </div>

          <div className="bento-card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <BarChart3 size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Outlet Performance</p>
                <p className="text-[11px] text-gray-400">Revenue by outlet · {range.label.toLowerCase()}</p>
              </div>
            </div>
            {outletChartData.length ? (
              <HorizontalBarChart data={outletChartData} color="#0ea5e9" name="Revenue" formatValue={formatCompactINR} />
            ) : (
              <p className="py-8 text-center text-xs text-gray-400">No outlet revenue in this period.</p>
            )}
          </div>
        </div>

        {/* ── Top Performing Voucher: horizontal card carousel, ranked by real usage ── */}
        <div className="bento-card mb-4">
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
                {voucherScroll.left && (
                  <button
                    onClick={() => scrollVouchers(-1)}
                    aria-label="Scroll left"
                    className="animate-fade-in hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-100"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}

                <div
                  ref={voucherScrollRef}
                  onScroll={updateVoucherScroll}
                  className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x px-1"
                >
                  {topVouchers.map(({ v, usage }) => (
                    <VoucherTicketCard key={v._id} voucher={v} usage={usage} />
                  ))}
                </div>

                {voucherScroll.right && (
                  <button
                    onClick={() => scrollVouchers(1)}
                    aria-label="Scroll right"
                    className="animate-fade-in hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-100"
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Recent transactions ── */}
        <div className="bento-card overflow-hidden">
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
                      <tr key={row.orderId} className="hover:bg-white/60 dark:hover:bg-gray-700/50 transition-colors">
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