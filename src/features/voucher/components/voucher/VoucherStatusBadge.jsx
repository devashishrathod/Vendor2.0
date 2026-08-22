// src/components/voucher/VoucherStatusBadge.jsx
import React from "react";

const STATUS_STYLES = {
  DRAFT: "text-gray-500",
  UNDER_REVIEW: "text-amber-500",
  APPROVED: "text-sky-600",
  REJECTED: "text-rose-500",
  PUBLISHED: "text-emerald-600",
  EXPIRED: "text-rose-500",
  ARCHIVED: "text-gray-400",
  // Legacy display-only values (older mock data)
  Active: "text-emerald-600",
  Expired: "text-rose-500",
  "Under Review": "text-amber-500",
};

function toLabel(status) {
  if (!status) return "—";
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function VoucherStatusBadge({ status, tooltip }) {
  const className = STATUS_STYLES[status] || "text-gray-500";
  return (
    <span
      className={`text-sm font-medium ${className} ${tooltip ? "cursor-help underline decoration-dotted" : ""}`}
      title={tooltip || undefined}
    >
      {toLabel(status)}
    </span>
  );
}