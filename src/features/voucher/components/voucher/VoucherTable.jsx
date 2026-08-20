// src/components/voucher/VoucherTable.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Calendar,
  Download,
  Plus,
  Send,
  Pencil,
  Rocket,
  Loader2,
} from "lucide-react";
import VoucherStatusBadge from "./VoucherStatusBadge";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
const TABLE_HEAD = [
  "Voucher",
  "Version Code",
  "Validity",
  "Discount",
  "Status",
  "Action",
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "PUBLISHED", label: "Published" },
  { value: "EXPIRED", label: "Expired" },
  { value: "ARCHIVED", label: "Archived" },
];

// Exports the currently-loaded page of vouchers as a CSV file — client
// side, since there's no confirmed "export" endpoint from Postman.
function exportVouchersToCsv(vouchers) {
  const headers = ["Name", "Version Code", "Start Date", "End Date", "Discount", "Status"];
  const rows = vouchers.map((v) => [
    v.name,
    v.versionCode,
    v.startAt,
    v.endAt,
    summarizeDiscount(v.offers),
    v.status,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "vouchers.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function summarizeDiscount(offers) {
  const offer = offers?.[0];
  if (!offer) return "—";
  return offer.title || `${offer.discountValue}${offer.discountType === "PERCENTAGE" ? "%" : "₹"} OFF`;
}

function buildPageList(page, totalPages) {
  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) pages.push(i);
  return pages;
}

// Icon-only action button — the action name only shows on hover (native
// title tooltip), keeping the Action column compact.
function ActionIconButton({ icon: Icon, label, isLoading, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={isLoading}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
    </button>
  );
}

export default function VoucherTable({
  vouchers,
  isLoading,
  page,
  rowsPerPage,
  totalPages,
  search,
  dateRange = { from: "", to: "" },
  statusFilter = "",
  stateSummary,
  actionLoadingId,
  onSearchChange,
  onRowsPerPageChange,
  onPageChange,
  onOpenAddDiscount,
  onStatusFilterChange,
  onDateRangeChange,
  onSubmitForReview,
  onPublish,
}) {
  const navigate = useNavigate();

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Toolbar — search, filters, rows-per-page, actions and pagination
          all sit on one responsive line (wraps on narrow screens). */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-400 transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
          <Search className="h-4 w-4 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Here: Voucher Id/Title Name /Publisher Date, Value, Status"
            className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange?.(e.target.value)}
            className="bg-transparent text-sm text-gray-600 outline-none"
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600">
          <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => onDateRangeChange?.({ ...dateRange, from: e.target.value })}
            className="bg-transparent text-sm text-gray-600 outline-none"
          />
          <span className="text-gray-300">–</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => onDateRangeChange?.({ ...dateRange, to: e.target.value })}
            className="bg-transparent text-sm text-gray-600 outline-none"
          />
          {(dateRange.from || dateRange.to) && (
            <button
              type="button"
              onClick={() => onDateRangeChange?.({ from: "", to: "" })}
              className="text-xs text-gray-400 hover:text-emerald-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="hidden text-xs text-gray-400 sm:inline">Rows:</span>
          <div className="flex overflow-hidden rounded-xl border border-gray-200">
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onRowsPerPageChange(option)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  rowsPerPage === option
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={vouchers.length === 0}
          onClick={() => exportVouchersToCsv(vouchers)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          Export Data
        </button>

        <button
          onClick={onOpenAddDiscount}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold tracking-wide text-white shadow-sm shadow-emerald-100 transition-colors hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Add Voucher/Discount
        </button>

        <div className="ml-auto flex items-center gap-1 text-sm text-gray-500">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {buildPageList(page, totalPages).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-7 w-7 rounded-lg text-sm font-medium transition-colors ${
                p === page ? "bg-emerald-500 text-white" : "hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-t border-gray-100">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {TABLE_HEAD.map((head) => (
                <th
                  key={head}
                  className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={TABLE_HEAD.length} className="px-4 py-8 text-center text-gray-400">
                  Loading vouchers…
                </td>
              </tr>
            ) : vouchers.length === 0 ? (
              <tr>
                <td colSpan={TABLE_HEAD.length} className="px-4 py-8 text-center text-gray-400">
                  No vouchers found.
                </td>
              </tr>
            ) : (
              vouchers.map((version, index) => {
                // `version.status` drives the whole workflow: DRAFT →
                // (Submit for Review) → UNDER_REVIEW → APPROVED/REJECTED →
                // (Publish) → PUBLISHED. Editing a PUBLISHED or REJECTED
                // version creates/resets it back to DRAFT and the cycle
                // repeats — the old published version is auto-archived by
                // the backend once the new one publishes successfully.
                const status = version.status;
                const thumbnail = version.images?.[0]?.url;
                const isSubmitting = actionLoadingId === version.voucherId;
                const isPublishing = actionLoadingId === version._id;
                const goToEdit = () => navigate(`/vouchers/${version.voucherId}/edit`);

                return (
                  <tr
                    key={version._id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {thumbnail && (
                          <img
                            src={thumbnail}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover"
                          />
                        )}
                        <button
                          onClick={() => navigate(`/vouchers/${version.voucherId}`)}
                          className="max-w-[220px] truncate text-left font-medium text-emerald-600 hover:underline"
                        >
                          {version.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{version.versionCode}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(version.startAt)} – {formatDate(version.endAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {summarizeDiscount(version.offers)}
                    </td>
                    <td className="px-4 py-3">
                      <VoucherStatusBadge
                        status={status}
                        tooltip={status === "REJECTED" ? version.rejectionReason : undefined}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {status === "DRAFT" && (
                        <div className="flex items-center gap-2">
                          <ActionIconButton
                            icon={Send}
                            label="Submit for Review"
                            isLoading={isSubmitting}
                            onClick={() => onSubmitForReview(version.voucherId)}
                          />
                          <ActionIconButton
                            icon={Pencil}
                            label="Edit"
                            onClick={goToEdit}
                          />
                        </div>
                      )}
                      {status === "UNDER_REVIEW" && (
                        <span className="text-xs font-medium text-amber-600">
                          Your Voucher is in Under Review
                        </span>
                      )}
                      {status === "APPROVED" && (
                        <ActionIconButton
                          icon={Rocket}
                          label="Publish"
                          isLoading={isPublishing}
                          onClick={() => onPublish(version._id)}
                        />
                      )}
                      {(status === "PUBLISHED" || status === "REJECTED") && (
                        <ActionIconButton
                          icon={Pencil}
                          label="Edit"
                          onClick={goToEdit}
                        />
                      )}
                      {!["DRAFT", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "REJECTED"].includes(
                        status
                      ) && <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
        <span>
          Showing {stateSummary.rangeStart}-{stateSummary.rangeEnd} of {vouchers.length ? stateSummary.rangeEnd : 0}
        </span>
      </div>
    </div>
  );
}
