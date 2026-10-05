import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, CalendarDays, Download, Undo2 } from "lucide-react";
import Select from "@/components/common/Select";

// "Open" sends open=true (the confirmed Postman request); "All" omits the
// param so the backend applies no open/closed filter.
const OPEN_FILTER_OPTIONS = [
  { value: "open", label: "Open Refunds" },
  { value: "all", label: "All Refunds" },
];

// ─── Refund table: toolbar + table — same layout as TransactionOverview ───
export default function RefundOverview({ rows, openFilter, onOpenFilterChange, dateRange, onDateRangeChange, onDecide }) {
  const [collapsed, setCollapsed] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Status vocabulary isn't documented yet, so the filter only offers the
  // statuses actually present in the loaded rows.
  const statusOptions = useMemo(
    () => [...new Set(rows.map((r) => r.status).filter(Boolean))],
    [rows]
  );

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        [row.refundId, row.claimId, row.claimCode, row.transactionId, row.reason, row.reasonNote]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const pageRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleExport = () => {
    const headers = [
      "Refund Id", "Claim Code", "Claim Id", "Transaction Id", "Requested Amount", "Vendor Clawback",
      "Promo Reversal", "Refund Type", "Reason", "Reason Note", "Method", "Respond By",
      "Created On", "Updated On", "Status", "Open",
    ];
    const csvRows = filteredRows.map((r) =>
      [
        r.refundId, r.claimCode, r.claimId, r.transactionId, r.requestedAmount, r.vendorClawback,
        r.vendorPromoReversal, r.refundType, r.reason, r.reasonNote, r.method, r.respondBy,
        r.createdOn, r.updatedOn, r.status, r.isOpen ? "Yes" : "No",
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "refunds.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden mb-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Undo2 className="h-4 w-4 text-emerald-600" />
          Refund Requests
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
          {/* Toolbar: rows-per-page + pagination (top), search + filters + date + export */}
          <div className="px-5 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Rows per page:</span>
                {[10, 20, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => { setRowsPerPage(n); setCurrentPage(1); }}
                    className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors
                      ${rowsPerPage === n
                        ? "bg-gray-900 text-white"
                        : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30"
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
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 disabled:opacity-30"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-4">
              {/* Search */}
              <div className="flex w-52 flex-shrink-0 items-center gap-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 px-3 py-2 text-sm text-gray-400 transition-colors focus-within:ring-2 focus-within:ring-emerald-100">
                <Search className="h-4 w-4 flex-shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Search Here: Refund, Claim, Txn Id"
                  className="w-full bg-transparent text-gray-700 dark:text-gray-100 outline-none placeholder:text-gray-400 truncate"
                />
              </div>

              {/* Open / All — refetches from the API (Refunds.jsx owns it) */}
              <div className="relative flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 px-3 py-2 pr-7 text-sm text-gray-600 dark:text-gray-300">
                <Undo2 className="h-4 w-4 shrink-0 text-gray-400" />
                <Select
                  compact
                  value={openFilter}
                  onChange={(value) => { onOpenFilterChange(value); setCurrentPage(1); }}
                  options={OPEN_FILTER_OPTIONS}
                  className="bg-transparent text-gray-600 dark:text-gray-300"
                />
              </div>

              {/* Status filter */}
              <div className="relative flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 px-3 py-2 pr-7 text-sm text-gray-600 dark:text-gray-300">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-400" />
                <Select
                  compact
                  value={statusFilter}
                  onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
                  options={[{ value: "all", label: "All Statuses" }, ...statusOptions.map((s) => ({ value: s, label: s }))]}
                  className="bg-transparent text-gray-600 dark:text-gray-300"
                />
              </div>

              {/* Date range — filters on createdAt (Refunds.jsx owns this state) */}
              <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                  max={dateRange.to || undefined}
                  className="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none"
                />
                <span className="text-gray-300">–</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                  min={dateRange.from || undefined}
                  className="bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none"
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
                className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1a1a2e]">
                  {[
                    "Refund Id", "Claim Code", "Claim Id", "Transaction Id", "Requested Amount",
                    "Vendor Clawback", "Promo Reversal", "Refund Type", "Reason",
                    "Method", "Respond By", "Created on", "Updated on", "Status", "Action",
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
                    <td colSpan={15} className="px-3 py-8 text-center text-gray-400">
                      No refunds found.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={row.refundId} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap font-semibold text-blue-600">{row.refundId}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">{row.claimCode}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.claimId}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.transactionId}</td>
                      <td className="px-3 py-2 text-green-700 dark:text-green-600 font-medium whitespace-nowrap">{row.requestedAmount}</td>
                      <td className="px-3 py-2 text-rose-500 whitespace-nowrap">{row.vendorClawback}</td>
                      <td className="px-3 py-2 text-rose-500 whitespace-nowrap">{row.vendorPromoReversal}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.refundType}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <p className="text-gray-700 dark:text-gray-300">{row.reason}</p>
                        {row.reasonNote && (
                          <p className="text-gray-400 max-w-[220px] truncate" title={row.reasonNote}>{row.reasonNote}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.method}</td>
                      <td className="px-3 py-2 text-amber-600 whitespace-nowrap">{row.respondBy}</td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.createdOn}</td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.updatedOn}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
                            ${row.isOpen
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                            }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      {/* Backend's own `canDecide` flag decides whether the
                          vendor may still approve/reject this request. */}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {row.canDecide ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onDecide("approve", row)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onDecide("reject", row)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
