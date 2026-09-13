// src/components/settlement/SettlementTable.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  CalendarDays,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react";

const currency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function StatusBadge({ status }) {
  const isDone = status?.toLowerCase().includes("done");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isDone ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isDone ? "bg-emerald-500" : "bg-amber-500"}`} />
      {status}
    </span>
  );
}

// ⚠️ No confirmed response yet for GET /settlements includes a per-item
// breakdown, so `row.breakup` (see useSettlement.js's mapSettlementRow)
// comes through zeroed rather than fabricated non-zero numbers — the
// original UI section stays exactly as it was.
function BreakupRow({ breakup }) {
  const items = [
    { label: "Discount Summary", value: breakup.discountSummary, tone: "text-slate-700" },
    { label: "Best Pack Summary", value: breakup.bestPackSummary, tone: "text-slate-700" },
    { label: "Membership Summary", value: breakup.membershipSummary, tone: "text-slate-700" },
    { label: "GST Summary", value: breakup.gstSummary, tone: "text-slate-700" },
    { label: "Processing Fee", value: breakup.processingFee, tone: "text-rose-500" },
    { label: "Service Charge", value: breakup.serviceCharge, tone: "text-rose-500" },
    { label: "Paid Amount", value: breakup.paidAmount, tone: "text-slate-900 font-semibold" },
  ];
  return (
    <tr className="bg-slate-50">
      <td colSpan={7} className="px-6 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Amount Breakup
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:grid-cols-7">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className={`mt-0.5 text-sm ${item.tone}`}>{currency(item.value)}</p>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
}

export default function SettlementTable({
  rows,
  total,
  page,
  setPage,
  totalPages,
  pageSize,
  pageSizes,
  onPageSizeChange,
  search,
  onSearchChange,
  statusOptions,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  expandedRow,
  toggleRow,
  loading,
}) {
  const navigate = useNavigate();

  const goToDetails = (settlementId) => {
    navigate(`/settlement/${settlementId}`);
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {pageSizes.map((size) => (
            <button
              key={size}
              onClick={() => onPageSizeChange(size)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                pageSize === size
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {size}
            </button>
          ))}
          <span className="ml-1 pr-1 text-xs text-slate-400">Rows per page</span>
        </div>

        <div className="flex flex-1 flex-nowrap items-center gap-2 overflow-x-auto sm:justify-end">
          <div className="flex w-44 flex-shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-400 transition-colors focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
            <Search className="h-4 w-4 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Here: Settlement, Txn Id"
              className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400 truncate"
            />
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="bg-transparent text-sm text-slate-600 outline-none"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
              max={dateRange.to || undefined}
              className="bg-transparent text-sm text-slate-600 outline-none"
            />
            <span className="text-slate-300">–</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
              min={dateRange.from || undefined}
              className="bg-transparent text-sm text-slate-600 outline-none"
            />
            {(dateRange.from || dateRange.to) && (
              <button
                type="button"
                onClick={() => onDateRangeChange({ from: "", to: "" })}
                className="text-xs text-slate-400 hover:text-indigo-600"
              >
                Clear
              </button>
            )}
          </div>

          <button className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="bg-[#1a1a2e]">
              <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/80">Settlement Id</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/80">Payment Received Date</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/80">Settlement On</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/80">Transaction ID</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/80">Amount</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-white/80">Status</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wide text-white/80">Info</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">
                  Loading settlements…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">
                  No settlements match your search.
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row) => {
                const isOpen = expandedRow === row.settlementId + row.transactionId;
                const rowKey = row.settlementId + row.transactionId;
                return (
                  <React.Fragment key={rowKey}>
                    <tr className="border-b border-slate-100 bg-white last:border-b-0 hover:bg-slate-50/60">
                      <td className="px-3 py-2">
                        <button
                          onClick={() => goToDetails(row.settlementId)}
                          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
                        >
                          {row.settlementId}
                          <Copy className="h-3 w-3 text-slate-300" />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">{row.paymentReceivedDate}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">{row.settlementOn}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">{row.transactionId}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-800">
                        {currency(row.amount)}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => toggleRow(rowKey)}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {isOpen && <BreakupRow breakup={row.breakup} />}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <p className="text-xs text-slate-400">
          Showing {rows.length} of {total} settlements
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-7 w-7 rounded-md text-xs font-medium transition ${
                p === page
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
