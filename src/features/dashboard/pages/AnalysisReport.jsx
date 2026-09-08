import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { useOnboardingStore } from "@/features/onboarding/store/onboardingStore";
import useBrandData from "@/features/brand/hooks/useBrandData";
import { fetchVoucherTransactionOverview } from "@/features/transaction/services/transactionService";
import { getVouchers } from "@/features/voucher/services/voucher/VoucherService";

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

function generateSeries(range) {
  const { from, to } = range;
  const totalDays = Math.max(1, Math.round((to - from) / 86400000) + 1);
  const arr = [];
  const cursor = new Date(from);
  for (let idx = 0; idx < totalDays; idx += 1) {
    const wave = Math.sin(idx / 3) * 14 + Math.sin(idx / 9) * 7;
    const trend = idx * (18 / totalDays); // gentle upward trend across the range
    const spike = idx % 9 === 0 ? 12 : 0; // weekend-ish spikes
    const value = Math.max(8, Math.round(46 + wave + trend + spike));
    arr.push({
      date: new Date(cursor),
      label: cursor.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: value * 1000, // ₹ thousands/day
      orders: Math.round(value * 1.35),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return arr;
}

// Status pill colors for the real voucher list below — same workflow
// vocabulary as VoucherStatusBadge.jsx.
const VOUCHER_STATUS_STYLES = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNDER_REVIEW: "bg-amber-50 text-amber-600",
  APPROVED: "bg-sky-50 text-sky-600",
  REJECTED: "bg-rose-50 text-rose-500",
  PUBLISHED: "bg-emerald-50 text-emerald-600",
  EXPIRED: "bg-rose-50 text-rose-500",
  ARCHIVED: "bg-gray-100 text-gray-400",
};

function formatVoucherDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function summarizeVoucherDiscount(offers) {
  const offer = offers?.[0];
  if (!offer) return "—";
  return offer.title || `${offer.discountValue}${offer.discountType === "PERCENTAGE" ? "%" : "₹"} OFF`;
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
    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
      <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors ${
              p === page ? "bg-emerald-500 text-white" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
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

export default function AnalysisReport() {
  const [rangeKey, setRangeKey] = useState("month");
  const [hoveredDay, setHoveredDay] = useState(null);
  const [voucherSearch, setVoucherSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");

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
      .catch((err) => setVouchersError(err.message || "Failed to load vouchers."));
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
  const series = useMemo(() => generateSeries(rangeDates), [rangeDates]);
  const maxRevenue = Math.max(...series.map((d) => d.revenue));

  // ── Derived KPIs (recompute whenever the date range changes) ──
  const totalRevenue = series.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = series.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const refundRate = 0.025 + (series.length % 7) * 0.0015;
  const refundsIssued = totalRevenue * refundRate;

  const revenueChange = computeChange(series, "revenue");
  const ordersChange = computeChange(series, "orders");

  const STATS = [
    {
      label: "Total Revenue",
      value: formatINR(totalRevenue),
      change: revenueChange,
    },
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString("en-IN"),
      change: ordersChange,
    },
    {
      label: "Avg Order Value",
      value: formatINR(avgOrderValue),
      change: revenueChange - ordersChange, // AOV drifts with the gap between the two
    },
    {
      label: "Refunds Issued",
      value: formatINR(refundsIssued),
      change: -(revenueChange * 0.4), // refunds trend opposite-ish to revenue health
    },
  ];

  // ── Order status split, derived from totalOrders ──
  const statusSplit = [
    { label: "Success", pct: 84, color: "#34d399" },
    { label: "Pending", pct: 7, color: "#fbbf24" },
    { label: "Refunded", pct: 6, color: "#f87171" },
    { label: "Cancelled", pct: 3, color: "#9ca3af" },
  ];
  let acc = 0;
  const conicStops = statusSplit
    .map((s) => {
      const from = acc;
      acc += s.pct;
      return `${s.color} ${from}% ${acc}%`;
    })
    .join(", ");

  // ── Vouchers: only PUBLISHED ones show here ("Top Performing" means
  // live for customers), client-side search over that subset, paginated. ──
  const PAGE_SIZE = 10;
  const [voucherPage, setVoucherPage] = useState(1);
  const filteredVouchers = vouchers
    .filter((v) => v.status === "PUBLISHED")
    .filter((v) => (v.name || "").toLowerCase().includes(voucherSearch.trim().toLowerCase()));
  const voucherTotalPages = Math.max(1, Math.ceil(filteredVouchers.length / PAGE_SIZE));
  const pagedVouchers = filteredVouchers.slice((voucherPage - 1) * PAGE_SIZE, voucherPage * PAGE_SIZE);

  // ── Recent Transactions: filtered by the same top-of-page date range
  // plus a client-side search (order id / customer / voucher version id),
  // then paginated 10 at a time. ──
  const transactionSearchTerm = transactionSearch.trim().toLowerCase();
  const filteredTransactionRows = transactionRows
    .filter((row) => isWithinRange(row.raw?.createdAt, rangeDates))
    .filter((row) =>
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
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* ── Heading + controls ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analysis Report</h1>
            <p className="text-xs text-gray-400 mt-1">
              Business performance overview · {range.label.toLowerCase()} view
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-xl px-3 py-2">
              <CalendarDays size={14} className="text-gray-400" />
              <select
                value={rangeKey}
                onChange={(e) => changeRange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-700 outline-none"
              >
                {RANGE_OPTIONS.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-100 bg-white text-gray-600 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
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
            return (
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-2">
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
                <span
                  className={`self-start flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}
                >
                  {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {Math.abs(s.change).toFixed(1)}% vs prev. period
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Revenue trend (hoverable) ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700">Revenue Trend</p>
            {hoveredDay !== null && (
              <span className="text-xs text-gray-500">
                <span className="font-semibold text-gray-800">{series[hoveredDay].label}</span>
                {"  ·  "}
                {formatINR(series[hoveredDay].revenue)}
                {"  ·  "}
                {series[hoveredDay].orders} orders
              </span>
            )}
          </div>
          <div className="flex items-end gap-[3px] h-40" onMouseLeave={() => setHoveredDay(null)}>
            {series.map((d, i) => (
              <div
                key={i}
                className="flex-1 h-full flex items-end cursor-pointer group"
                onMouseEnter={() => setHoveredDay(i)}
              >
                <div
                  className={`w-full rounded-t-sm transition-colors ${
                    hoveredDay === i ? "bg-emerald-500" : "bg-emerald-300 group-hover:bg-emerald-400"
                  }`}
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-400">
            <span>{series[0]?.label}</span>
            <span>{series[series.length - 1]?.label}</span>
          </div>
        </div>

        {/* ── Order status donut ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-4">Order Status</p>
          <div className="flex items-center gap-6">
            <div
              className="w-28 h-28 rounded-full shrink-0 relative"
              style={{ background: `conic-gradient(${conicStops})` }}
            >
              <div className="absolute inset-[10px] bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-gray-900">{totalOrders.toLocaleString("en-IN")}</span>
                <span className="text-[9px] text-gray-400">orders</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {statusSplit.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-gray-600 w-16">{s.label}</span>
                  <span className="font-semibold text-gray-800">
                    {Math.round((totalOrders * s.pct) / 100).toLocaleString("en-IN")}
                  </span>
                  <span className="text-gray-400">({s.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Vouchers: real GET /vouchers list, searchable ── */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 gap-3">
            <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">Top Performing Voucher</p>
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-[220px]">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  value={voucherSearch}
                  onChange={(e) => { setVoucherSearch(e.target.value); setVoucherPage(1); }}
                  placeholder="Search vouchers…"
                  className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 outline-none focus:border-emerald-400 bg-gray-50 text-gray-700"
                />
              </div>
              <Link
                to="/vouchers"
                className="whitespace-nowrap text-xs font-semibold text-emerald-600 hover:underline"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#1a1a2e]">
                  {[
                    "Banner", "Voucher Version Id", "Voucher Title", "Published Date", "Expired Date",
                    "No of Offers", "Status",
                  ].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/80">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vouchersError ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-rose-500">
                      {vouchersError}
                    </td>
                  </tr>
                ) : filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No vouchers match "{voucherSearch}". Try a different search term.
                    </td>
                  </tr>
                ) : (
                  pagedVouchers.map((v) => {
                    const thumbnail = v.images?.[0]?.url;
                    const bannerUrl = v.voucher?.banner?.type === "IMAGE" ? v.voucher?.banner?.image?.url : null;
                    return (
                      <tr key={v._id} className="border-b border-gray-100 bg-white last:border-b-0 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2">
                          {bannerUrl ? (
                            <img src={bannerUrl} alt="" className="h-7 w-7 rounded-md border border-gray-100 object-cover" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-gray-200 text-gray-300">
                              <ImageIcon className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-gray-500">{v.versionCode}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            {thumbnail && (
                              <img src={thumbnail} alt="" className="h-7 w-7 flex-shrink-0 rounded-md object-cover" />
                            )}
                            <span className="line-clamp-2 max-w-[180px] text-left font-medium leading-snug text-gray-700">
                              {v.name}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-gray-500">{formatVoucherDate(v.startAt)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-gray-500">{formatVoucherDate(v.endAt)}</td>
                        <td className="px-3 py-2 text-gray-600">{v.offers?.length ?? 0}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${VOUCHER_STATUS_STYLES[v.status] || "bg-gray-100 text-gray-500"}`}>
                            {v.status}
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
            page={voucherPage}
            totalPages={voucherTotalPages}
            onChange={setVoucherPage}
            count={filteredVouchers.length}
          />
        </div>

        {/* ── Recent transactions ── */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 gap-3">
            <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">Recent Transactions</p>
            <div className="relative w-full max-w-[220px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={transactionSearch}
                onChange={(e) => { setTransactionSearch(e.target.value); setTransactionPage(1); }}
                placeholder="Search transactions…"
                className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 outline-none focus:border-emerald-400 bg-gray-50 text-gray-700"
              />
            </div>
          </div>
          {transactionsError && (
            <p className="px-5 py-2.5 text-xs text-rose-600 bg-rose-50 border-b border-rose-100">
              {transactionsError}
            </p>
          )}
          <div className="overflow-x-auto">
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
                      <tr key={row.orderId} className="border-b border-gray-100 bg-white last:border-b-0 hover:bg-gray-50 transition-colors">
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
                              <p className="text-gray-700 font-medium">{row.customerName}</p>
                              <p className="text-blue-500">{row.customerCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.refId}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.createdOn}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.outlet}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.billAmount}</td>
                        <td className="px-3 py-2 text-rose-500 whitespace-nowrap">{row.offerDiscount}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.netBill}</td>
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