import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
export default function TransactionOverview({ activeTxnTab, voucherData }) {
  const [collapsed, setCollapsed] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const data =
    activeTxnTab === "voucher"
      ? voucherData || EMPTY_VOUCHER_OVERVIEW
      : TRANSACTION_DATA[activeTxnTab];
  const activeIcon = TRANSACTION_TABS.find((t) => t.key === activeTxnTab)?.icon;

  // Search — Customer Name & ID, Voucher/Deal Pack/Membership Id, Outlet Details
  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data.rows;
    return data.rows.filter((row) =>
      [row.customerName, row.customerCode, row.refId, row.outlet, row.orderId]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [data.rows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pageRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Export current filtered rows as CSV
  const handleExport = () => {
    const headers = ["Order Id", "Customer", "Customer Code", data.idLabel, "Created On", "Outlet", "Amount", "Status"];
    const csvRows = filteredRows.map((r) =>
      [r.orderId, r.customerName, r.customerCode, r.refId, r.createdOn, r.outlet, r.amount, r.status]
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
          {/* Stat strip */}
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

            <div className="flex flex-wrap items-center gap-3 pb-4">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 min-w-[260px] border border-gray-200 rounded-lg px-3 py-2">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-400 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder={`Search Here - Customer Name & ID, ${data.idLabel}, Outlet Details.`}
                  className="w-full text-xs text-gray-600 placeholder-gray-400 outline-none"
                />
              </div>

              {/* Filter — placeholder, wire up to real filter logic later */}
              <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 6v3m0 0a1.5 1.5 0 100 0zM10 12h8M13 12v3m0 0a1.5 1.5 0 100 0zM4 18h10M12 18v3m0 0a1.5 1.5 0 100 0z" />
                </svg>
                Filter
              </button>

              {/* Date range — placeholder, wire up to a date-picker later */}
              <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 whitespace-nowrap">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Feb 17, 2026, 10:18 - Mar 9, 2026, 23:59
              </button>

              {/* Export */}
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg px-3 py-2 hover:bg-indigo-100"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                Export Data
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-blue-50/60">
                  {["Order Id", "Customer detail", data.idLabel, "Created on", "Outlet Details", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                      No {data.sectionTitle.replace(" Overview", "")} transactions found.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const avatar = getAvatarColors(row.customerName);
                    return (
                      <tr key={row.orderId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
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
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold ring-2 flex-shrink-0
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
                        <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">{row.refId}</td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{row.createdOn}</td>
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">{row.outlet}</td>
                        <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">{row.amount}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full
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