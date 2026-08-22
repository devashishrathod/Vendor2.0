import { useState, useMemo } from "react";
import {
  Download,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// DATA GENERATION
// Deterministic (not random) so switching date range gives a
// consistent, explainable trend instead of jumping around.
// ══════════════════════════════════════════════════════════════

const RANGE_OPTIONS = [
  { key: "7d", label: "7 Days", days: 7 },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "90d", label: "90 Days", days: 90 },
];

function generateSeries(days) {
  const today = new Date();
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const idx = days - 1 - i;
    const wave = Math.sin(idx / 3) * 14 + Math.sin(idx / 9) * 7;
    const trend = idx * (18 / days); // gentle upward trend across the range
    const spike = idx % 9 === 0 ? 12 : 0; // weekend-ish spikes
    const value = Math.max(8, Math.round(46 + wave + trend + spike));
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    arr.push({
      date,
      label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      revenue: value * 1000, // ₹ thousands/day
      orders: Math.round(value * 1.35),
    });
  }
  return arr;
}

const RAW_PRODUCTS = [
  { name: "Voucher — Weekend Special", revenue: 28400, orders: 312 },
  { name: "Deal Pack — Family Combo", revenue: 19600, orders: 210 },
  { name: "Membership — Gold", revenue: 15200, orders: 98 },
  { name: "Voucher — Happy Hours", revenue: 11800, orders: 187 },
  { name: "Deal Pack — Solo Saver", revenue: 9320, orders: 143 },
];
const maxProductRevenue = Math.max(...RAW_PRODUCTS.map((p) => p.revenue));
const PRODUCTS = RAW_PRODUCTS.map((p) => ({
  ...p,
  share: Math.round((p.revenue / maxProductRevenue) * 100),
}));

const TRANSACTIONS = [
  { id: "TXN48213", customer: "Rohan Mehta", product: "Weekend Special", amount: 649, status: "Success", time: "12 min ago" },
  { id: "TXN48212", customer: "Priya Nair", product: "Gold Membership", amount: 1299, status: "Pending", time: "38 min ago" },
  { id: "TXN48211", customer: "Aditya Rao", product: "Family Combo", amount: 899, status: "Success", time: "1 hr ago" },
  { id: "TXN48210", customer: "Sneha Kapoor", product: "Happy Hours", amount: 449, status: "Refunded", time: "2 hr ago" },
  { id: "TXN48209", customer: "Vikram Singh", product: "Solo Saver", amount: 299, status: "Success", time: "3 hr ago" },
  { id: "TXN48208", customer: "Ananya Iyer", product: "Weekend Special", amount: 649, status: "Success", time: "5 hr ago" },
];

const STATUS_STYLES = {
  Success: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Refunded: "bg-red-50 text-red-600",
};

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

// ══════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════

export default function AnalysisReport() {
  const [rangeKey, setRangeKey] = useState("30d");
  const [hoveredDay, setHoveredDay] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [sortKey, setSortKey] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");

  const range = RANGE_OPTIONS.find((r) => r.key === rangeKey);
  const series = useMemo(() => generateSeries(range.days), [range.days]);
  const maxRevenue = Math.max(...series.map((d) => d.revenue));

  // ── Derived KPIs (recompute whenever the date range changes) ──
  const totalRevenue = series.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = series.reduce((s, d) => s + d.orders, 0);
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const refundRate = 0.025 + (range.days % 7) * 0.0015;
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

  // ── Top products: search + sort ──
  const filteredProducts = PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(productSearch.trim().toLowerCase())
  );
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    return (a[sortKey] - b[sortKey]) * dir;
  });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-emerald-600" /> : <ArrowDown size={12} className="text-emerald-600" />;
  };

  const exportCSV = () => {
    const header = "Product,Revenue,Orders,Share %\n";
    const rows = sortedProducts
      .map((p) => `"${p.name}",${p.revenue},${p.orders},${p.share}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `top-products-${rangeKey}.csv`;
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
            <div className="flex bg-white border border-gray-100 rounded-xl p-1">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRangeKey(r.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    rangeKey === r.key
                      ? "bg-[#1a1a2e] text-white"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {r.label}
                </button>
              ))}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* ── Order status donut ── */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
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

          {/* ── Category split ── */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Revenue by Category</p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Voucher", pct: 46, color: "bg-emerald-400" },
                { label: "Deal Pack", pct: 31, color: "bg-purple-400" },
                { label: "Membership", pct: 23, color: "bg-amber-400" },
              ].map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{c.label}</span>
                    <span className="font-semibold text-gray-700">
                      {formatINR((totalRevenue * c.pct) / 100)} · {c.pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Top products: searchable + sortable ── */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 gap-3">
            <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">Top Performing Products</p>
            <div className="relative w-full max-w-[220px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 outline-none focus:border-emerald-400 bg-gray-50 text-gray-700"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-gray-400 font-medium">Product</th>
                  {[
                    { key: "revenue", label: "Revenue" },
                    { key: "orders", label: "Orders" },
                    { key: "share", label: "Share" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="text-left px-5 py-3 text-gray-400 font-medium cursor-pointer select-none hover:text-gray-600"
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        <SortIcon colKey={col.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                      No products match "{productSearch}". Try a different search term.
                    </td>
                  </tr>
                ) : (
                  sortedProducts.map((row) => (
                    <tr key={row.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{row.name}</td>
                      <td className="px-5 py-3.5 text-gray-700">{formatINR(row.revenue)}</td>
                      <td className="px-5 py-3.5 text-gray-500">{row.orders}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${row.share}%` }} />
                          </div>
                          <span className="text-gray-500 w-8 text-right">{row.share}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recent transactions ── */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Recent Transactions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Txn ID", "Customer", "Product", "Amount", "Status", "Time"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-400 font-mono">{t.id}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{t.customer}</td>
                    <td className="px-5 py-3.5 text-gray-500">{t.product}</td>
                    <td className="px-5 py-3.5 text-gray-700">{formatINR(t.amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">{t.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}