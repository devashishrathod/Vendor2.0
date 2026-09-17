// src/components/voucher/VoucherStatusBadge.jsx
const STATUS_STYLES = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNDER_REVIEW: "bg-amber-50 text-amber-600",
  APPROVED: "bg-sky-50 text-sky-600",
  REJECTED: "bg-rose-50 text-rose-500",
  PUBLISHED: "bg-emerald-50 text-emerald-600",
  EXPIRED: "bg-rose-50 text-rose-500",
  ARCHIVED: "bg-gray-100 text-gray-400",
  // Legacy display-only values (older mock data)
  Active: "bg-emerald-50 text-emerald-600",
  Expired: "bg-rose-50 text-rose-500",
  "Under Review": "bg-amber-50 text-amber-600",
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
  const className = STATUS_STYLES[status] || "bg-gray-100 text-gray-500";

  if (!tooltip) {
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>
        {toLabel(status)}
      </span>
    );
  }

  // Custom hover card instead of the native `title` attribute — a browser
  // tooltip can't wrap/style a long rejection reason at all (single line,
  // gets cut off, no control over width), so long reasons were unreadable.
  // pointer-events-none on the card keeps it purely informational — it
  // never intercepts clicks on the row underneath.
  return (
    <span className="group relative inline-flex">
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${className} cursor-help underline decoration-dotted underline-offset-2`}>
        {toLabel(status)}
      </span>

      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-xl border border-rose-100 bg-white p-3 text-left opacity-0 shadow-lg shadow-rose-100/50 transition-opacity duration-150 group-hover:opacity-100"
      >
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-rose-500">
          Rejection reason
        </p>
        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-700">
          {tooltip}
        </p>
        <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-rose-100 bg-white" />
      </div>
    </span>
  );
}