// src/components/voucher/VoucherOverview.jsx
import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import VoucherStatCard from "./VoucherStatCard";

const formatCurrency = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function VoucherOverview({ stats, isLoading, isExpanded, onToggleExpanded }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Overall collection */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <p className="text-xs text-gray-500">Overall Collection Amount</p>
          <p className="text-2xl font-semibold text-gray-900">
            {isLoading ? "—" : formatCurrency(stats?.overallCollectionAmount)}
          </p>
        </div>
        <button className="text-sm font-medium text-indigo-600 hover:underline">
          Live Updates
        </button>
      </div>

      {/* Quick stats row */}
      <div className="flex flex-wrap items-center gap-y-4 divide-x divide-gray-100 px-5 py-4">
        <VoucherStatCard
          label="Overall Paid Amount"
          value={isLoading ? "—" : formatCurrency(stats?.overallPaidAmount)}
        />
        <VoucherStatCard
          label="Discount Amount"
          value={isLoading ? "—" : formatCurrency(stats?.discountAmount)}
        />
        <VoucherStatCard
          label="Additional Discount"
          value={isLoading ? "—" : `-${formatCurrency(Math.abs(stats?.additionalDiscount ?? 0))}`}
          valueClassName="text-rose-500"
        />
        <VoucherStatCard
          label="Gst Amount"
          value={isLoading ? "—" : formatCurrency(stats?.gstAmount)}
        />
        <VoucherStatCard
          label="Active Voucher"
          value={isLoading ? "—" : `No.of  Count :${stats?.activeVoucherCount}`}
        />
        <VoucherStatCard
          label="Expired Voucher"
          value={isLoading ? "—" : `No.of  Count :${stats?.expiredVoucherCount}`}
        />
        <VoucherStatCard
          label="Pending Voucher"
          value={isLoading ? "—" : `No.of  Count :${String(stats?.pendingVoucherCount).padStart(2, "0")}`}
        />
      </div>

      {/* Collapsible header */}
      <button
        onClick={onToggleExpanded}
        className="flex w-full items-center justify-between rounded-b-xl border-t border-gray-100 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span>Voucher Overview</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
    </div>
  );
}