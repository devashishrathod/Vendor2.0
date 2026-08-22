// src/components/voucher/VoucherKeySummary.jsx
import React from "react";
import VoucherStatCard from "./VoucherStatCard";

export default function VoucherKeySummary({ keySummary, isExpiringSoon = true }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-gray-900">Voucher Key Summary</h2>
      <p className="mt-1 text-xs text-gray-500">
        View the key details of your voucher, including usage, validity, and
        performance.
      </p>

      <div className="mt-4 flex flex-wrap gap-x-10 gap-y-4">
        <VoucherStatCard
          label="Total Audience"
          value={`${keySummary?.totalAudiencePercent ?? 0} / 100 %`}
          valueClassName="text-rose-500"
        />
        <VoucherStatCard
          label="Total Engagement"
          value={`${keySummary?.totalEngagementClicks ?? 0} Clicks`}
        />
        <VoucherStatCard
          label="Total Impression"
          value={`${keySummary?.totalImpressionReach ?? 0} Reach`}
        />
      </div>

      {isExpiringSoon && (
        <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-xs font-medium text-rose-500">
          Your voucher will expire soon. Add more days to continue running the voucher,
          or you may lose out on potential sales.
        </div>
      )}
    </section>
  );
}