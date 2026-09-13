import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, CalendarDays, Download } from "lucide-react";
import TxnIcon from "./TxnIcon";
import { TRANSACTION_DATA, TRANSACTION_TABS } from "../data/transactionData";

// Small helper: deterministic accent color per customer, based on their name.
// Keeps every row's initials avatar visually distinct without needing real photos.
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

// Fixed, confirmed status vocabulary (see mapPaymentRow in
// transactionService.js) — "Paid" for a captured payment, Razorpay's own
// other statuses ("failed"/"created"/"authorized"/"refunded") capitalized
// otherwise, or "Pending" if the payment has no status at all. Listing
// these up front (instead of only whatever happens to already be loaded)
// means you can filter to "Failed" even when every row on screen right
// now is "Paid" — the previous dynamic-from-rows list could never offer
// an option for a status you hadn't already scrolled to.
const STATUS_OPTIONS = ["Paid", "Failed", "Refunded", "Authorized", "Created", "Pending"];

// Shown only until the real GET /voucher-claims/payments response lands —
// zeroed out rather than reusing any dummy numbers, so nothing fabricated
// ever flashes on screen even for a moment.
const EMPTY_VOUCHER_OVERVIEW = {
  sectionTitle: "Voucher Overview",
  idLabel: "Voucher Id",
  overviewStats: [
    { label: "Overall Bill Value", value: "₹ 0.00" },
    { label: "Overall Paid Amount", value: "₹ 0.00" },
    { label: "Discount Amount", value: "₹ 0.00", negative: true },
    { label: "Additional discount", value: "₹ 0.00", negative: true },
    { label: "Gst Amount", value: "₹ 0.00" },
  ],
  rows: [],
};

// ─── Overview section: toolbar + stats + table — content swaps per tab ────
// `voucherData` is fetched once by the parent (Transactions.jsx) — shared
// with the page header + Voucher Summary card — and passed in here.
// Dealpack/membership stay on the dummy TRANSACTION_DATA below (no backend
// endpoint for those yet). `voucherData` is null until it resolves, so the
// table's existing "no rows" empty state covers the loading moment too,
// without adding any new loading UI.
export default function TransactionOverview({ activeTxnTab, voucherData, dateRange, onDateRangeChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const data =
    activeTxnTab === "voucher"
      ? voucherData || EMPTY_VOUCHER_OVERVIEW
      : TRANSACTION_DATA[activeTxnTab];
  const activeIcon = TRANSACTION_TABS.find((t) => t.key === activeTxnTab)?.icon;

  // Voucher tab: the fixed, confirmed Razorpay-status vocabulary above.
  // Any other tab (dealpack/membership, still dummy data): real statuses
  // actually present in that tab's rows.
  const statusOptions = useMemo(
    () =>
      activeTxnTab === "voucher"
        ? STATUS_OPTIONS
        : [...new Set(data.rows.map((r) => r.status).filter(Boolean))],
    [activeTxnTab, data.rows]
  );

  // Search — Customer Name & ID, Voucher/Deal Pack/Membership Id, Outlet
  // Details — plus the Status filter, both applied together.
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.rows.filter((row) => {
      const matchesSearch =
        !term ||
        [row.customerName, row.customerCode, row.refId, row.outlet, row.orderId]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data.rows, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pageRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Export current filtered rows as CSV
  const handleExport = () => {
    const headers = [
      "Order Id", "Customer", "Customer Code", data.idLabel, "Razorpay Order Id", "Created On", "Outlet",
      "Bill Amount", "Offer Discount", "Promo Discount", "Net Bill", "Amount", "Payment Method", "Status",
    ];
    const csvRows = filteredRows.map((r) =>
      [
        r.orderId, r.customerName, r.customerCode, r.refId, r.razorpayOrderId, r.createdOn, r.outlet,
        r.billAmount, r.offerDiscount, r.promoDiscount, r.netBill, r.amount, r.paymentMethod, r.status,
      ]
        .map((v) => `"${v}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTxnTab}-transactions.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <TxnIcon type={activeIcon} />
          {data.sectionTitle}
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="Toggle section"
        >
          <svg
            width="16" height="16" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}
            className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Top Overview stat strip — removed per instruction, not needed.
          <div className="flex flex-wrap divide-x divide-gray-100 px-5 py-4 border-b border-gray-50">
            {data.overviewStats.map((stat) => (
              <div key={stat.label} className="px-6 first:pl-0 py-0.5">
                <p className="text-xs text-gray-400 mb-1 whitespace-nowrap">{stat.label}</p>
                <p className={`text-sm font-semibold whitespace-nowrap ${stat.negative ? "text-red-500" : "text-gray-900"}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          */}

          {/* Toolbar: rows-per-page + pagination (top), search + filter + date + export */}
          <div className="px-5 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Rows per page:</span>
                {[10, 20, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setRowsPerPage(n); setCurrentPage(1); }}
                    className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors border
                      ${rowsPerPage === n
                        ? "bg-gray-900 text-white border-gray-900"
                        : "text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors
                      ${currentPage === page
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-500 hover:bg-gray-100"
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-4">
              {/* Search */}
              <div className="flex w-52 flex-shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-400 transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <Search className="h-4 w-4 flex-shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder={`Search Here: Customer, ${data.idLabel}`}
                  className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400 truncate"
                />
              </div>

              {/* Status filter — real statuses present in this tab's rows,
                  not a fixed/fabricated list. */}
              <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent text-sm text-gray-600 outline-none"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Date range — real from/to, filters both the table below
                  and the "Voucher Collection" stat above (Transactions.jsx
                  owns this state so the two never disagree). */}
              <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600">
                <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                  max={dateRange.to || undefined}
                  className="bg-transparent text-sm text-gray-600 outline-none"
                />
                <span className="text-gray-300">–</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                  min={dateRange.from || undefined}
                  className="bg-transparent text-sm text-gray-600 outline-none"
                />
                {(dateRange.from || dateRange.to) && (
                  <button
                    type="button"
                    onClick={() => onDateRangeChange({ from: "", to: "" })}
                    className="text-xs text-gray-400 hover:text-emerald-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Export */}
              <button
                onClick={handleExport}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1a1a2e]">
                  {[
                    "Order Id", "Customer detail", "Voucher Version ID",  "Created on", "Outlet Store ID",
                    "Bill Amount", "Offer Discount", "Promo Discount", "Net Bill", "Paid Amount", "Payment Method", "Status",
                  ].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/80 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-3 py-8 text-center text-gray-400">
                      No {data.sectionTitle.replace(" Overview", "")} transactions found.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const avatar = getAvatarColors(row.customerName);
                    return (
                      <tr key={row.orderId} className="border-b border-gray-100 bg-white last:border-b-0 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {/* Order Id click → detail page. Routes on the
                              real payment _id (row.txnId) when present —
                              that's the actual GET /voucher-claims/payments/
                              :claimTransactionId lookup key — falling back
                              to orderId for the still-dummy dealpack/
                              membership tabs, which have no txnId. */}
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
                        {/* <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.razorpayOrderId}</td> */}
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.createdOn}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.outlet}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.billAmount}</td>
                        <td className="px-3 py-2 text-rose-500 whitespace-nowrap">{row.offerDiscount}</td>
                        <td className="px-3 py-2 text-rose-500 whitespace-nowrap">{row.promoDiscount}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.netBill}</td>
                        <td className="px-3 py-2 text-gray-700 font-medium whitespace-nowrap">{row.amount}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap capitalize">{row.paymentMethod}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
                              ${row.status === "Paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
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
        </>
      )}
    </div>
  );
}