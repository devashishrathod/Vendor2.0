// src/components/voucher/VoucherDetailsInfo.jsx
import React from "react";

const formatCurrency = (value) =>
  `₹${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const USE_LABELS = {
  android_ios_membership: "Valid on Android & iOS - Membership Users",
  android_only: "Exclusive for Android Users",
  ios_only: "Inclusive coupon code for iOS users",
  membership_only: "Membership Users Only",
};

const CLAIM_LABELS = {
  all_users: "Applicable across all users",
  membership_only: "Membership Users Only",
};

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-b-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function VoucherDetailsInfo({ voucher }) {
  if (!voucher) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Validity & Discount</h2>
        <Row label="Voucher Name" value={voucher.title} />
        <Row label="Start Date" value={`${voucher.startDate} ${voucher.startTime || ""}`} />
        <Row label="End Date" value={`${voucher.endDate} ${voucher.endTime || ""}`} />
        <Row label="Short Title" value={voucher.shortTitle} />
        <Row label="Value Of Amount" value={formatCurrency(voucher.valueOfAmount)} />
        <Row label="Percentage Of Discount" value={`${voucher.percentageOfDiscount || 0} %`} />
        <Row
          label="Single Use Per User"
          value={voucher.singleUsePerUser ? "Enabled" : "Disabled"}
        />
        <Row
          label="Multiple Use Until Expiry"
          value={voucher.multipleUseUntilExpiry ? "Enabled" : "Disabled"}
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Applicable Outlets</h2>
        <Row
          label="Selected Brand - Outlet / Sub-Brand"
          value={`Count - ${voucher.applicableOutlets?.selectedBrandOutletCount ?? 0}`}
        />
        <Row
          label="Total Outlet's"
          value={`Count - ${voucher.applicableOutlets?.totalOutletsCount ?? 0}`}
        />
        <Row
          label="Sub - Brand"
          value={`Count - ${voucher.applicableOutlets?.subBrandCount ?? 0}`}
        />
        <Row
          label="Franchise"
          value={`Count - ${String(voucher.applicableOutlets?.franchiseCount ?? 0).padStart(2, "0")}`}
        />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Search Tags</h2>
        <div className="flex flex-wrap gap-2">
          {(voucher.searchTags || []).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Eligibility</h2>
        <Row label="Who Can Use" value={USE_LABELS[voucher.whoCanUse] || "—"} />
        <Row label="Who Can Claim" value={CLAIM_LABELS[voucher.whoCanClaim] || "—"} />
      </section>
    </div>
  );
}