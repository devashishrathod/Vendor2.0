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
} from "lucide-react";
import VoucherStatusBadge from "./VoucherStatusBadge";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];
const TABLE_HEAD = [
  "Voucher Id",
  "Voucher Title",
  "Published Date",
  "Expired Date",
  "Discount",
  "Value Of Amount",
  "Earn Amount",
  "Status",
];

const formatCurrency = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function buildPageList(page, totalPages) {
  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) pages.push(i);
  return pages;
}

export default function VoucherTable({
  vouchers,
  isLoading,
  page,
  rowsPerPage,
  totalPages,
  search,
  stateSummary,
  onSearchChange,
  onRowsPerPageChange,
  onPageChange,
  onOpenAddDiscount,
}) {
  const navigate = useNavigate();

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Rows per page:</span>
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onRowsPerPageChange(option)}
                className={`px-3 py-1.5 text-sm ${
                  rowsPerPage === option
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-md p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {buildPageList(page, totalPages).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`h-7 w-7 rounded-md text-sm ${
                p === page ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md p-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search + filters + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400 w-full max-w-xs">
          <Search className="h-4 w-4" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Here: Voucher Id/Title Name /Publisher Date, Value, Status"
            className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Calendar className="h-4 w-4" />
            Feb 17, 2026, 12:00 – Mar 9, 2026, 23:59
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={onOpenAddDiscount}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Discount
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-900 text-white">
              {TABLE_HEAD.map((head) => (
                <th key={head} className="whitespace-nowrap px-4 py-3 font-medium">
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
              vouchers.map((voucher, index) => (
                <tr
                  key={voucher.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/vouchers/${voucher.id}`)}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      #{voucher.id}
                    </button>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-700">
                    {voucher.title}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{voucher.publishedDate}</td>
                  <td className="px-4 py-3 text-gray-600">{voucher.expiredDate}</td>
                  <td className="px-4 py-3 text-gray-600">{voucher.discount}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatCurrency(voucher.valueOfAmount)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatCurrency(voucher.earnAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <VoucherStatusBadge status={voucher.status} />
                  </td>
                </tr>
              ))
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