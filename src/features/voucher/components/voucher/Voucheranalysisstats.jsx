// src/components/voucher/VoucherAnalysisStats.jsx
import React from "react";
import VoucherStatCard from "./VoucherStatCard";

const formatCurrency = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function VoucherAnalysisStats({ analysis }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">
        Analysis Revenue Generated Through Vouchers
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        A Voucher Analysis Report helps businesses track and analyze voucher
        performance, customer usage, sales impact, and revenue growth.
      </p>

      <div className="mt-4 flex flex-wrap gap-x-10 gap-y-4 divide-x divide-gray-100">
        <VoucherStatCard
          label="Over All Earning"
          value={formatCurrency(analysis?.overAllEarning)}
        />
        <VoucherStatCard
          label="Total Bill Value"
          value={formatCurrency(analysis?.totalBillValue)}
        />
        <VoucherStatCard
          label="Total Discount Amount"
          value={formatCurrency(analysis?.totalDiscountAmount)}
        />
        <VoucherStatCard
          label="Additional Discount"
          value={formatCurrency(analysis?.additionalDiscount)}
        />
        <VoucherStatCard
          label="Paid Amount"
          value={formatCurrency(analysis?.paidAmount)}
        />
      </div>
    </section>
  );
}