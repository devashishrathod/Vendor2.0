// src/components/voucher/VoucherStatusBadge.jsx
import React from "react";

const STATUS_STYLES = {
  Active: "text-emerald-600",
  Expired: "text-rose-500",
  "Under Review": "text-amber-500",
};

export default function VoucherStatusBadge({ status }) {
  const className = STATUS_STYLES[status] || "text-gray-500";
  return (
    <span className={`text-sm font-medium ${className}`}>{status}</span>
  );
}