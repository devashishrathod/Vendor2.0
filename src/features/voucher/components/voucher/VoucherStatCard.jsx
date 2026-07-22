// src/components/voucher/VoucherStatCard.jsx
import React from "react";

export default function VoucherStatCard({ label, value, sublabel, valueClassName = "" }) {
  return (
    <div className="flex flex-col gap-1 px-4 first:pl-0 last:pr-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-lg font-semibold text-gray-900 ${valueClassName}`}>
        {value}
      </span>
      {sublabel ? <span className="text-xs text-gray-400">{sublabel}</span> : null}
    </div>
  );
}