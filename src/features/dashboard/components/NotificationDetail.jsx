import { ArrowLeft, ExternalLink, ReceiptText, Trash2 } from "lucide-react";

import { getNotificationVisual } from "../constants/notificationTypes";

// Confirmed values seen so far: severity "WARNING". The rest are the usual
// companions; anything unknown falls back to the neutral gray badge.
const SEVERITY_STYLES = {
  INFO: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  SUCCESS: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  WARNING: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  ERROR: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  CRITICAL: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const DEFAULT_SEVERITY_STYLE = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";

// Friendly labels for the confirmed `meta` keys (REFUND_REQUESTED sample).
// Any other key still shows, with an auto-generated label.
const META_LABELS = {
  claimCode: "Claim Code",
  amount: "Amount",
  reason: "Reason",
  respondBy: "Respond By",
  refundRequestId: "Refund Request ID",
  claimId: "Claim ID",
};
const META_ORDER = ["claimCode", "amount", "reason", "respondBy", "refundRequestId", "claimId"];
const HIDDEN_META_KEYS = new Set(["deepLink", "deeplink"]);
const ID_LIKE_KEYS = /Id$|^_id$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

// SERVICE_ISSUE → "Service issue", REFUND_REQUESTED → "Refund requested"
function humanize(value) {
  const text = String(value).replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// respondBy → "Respond by"
function labelFromKey(key) {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatMetaValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "amount" && typeof value === "number") {
    return `₹ ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (typeof value === "string" && ISO_DATE.test(value)) return formatDateTime(value);
  if (key === "reason") return humanize(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Full view of one notification inside the drawer: severity/type badges,
 * full body, every `meta` field as a labelled row, sent/read timestamps,
 * and actions (open its link, go to Refunds for refund notifications,
 * clear it).
 */
export default function NotificationDetail({ notification: n, onBack, onNavigate, onClear }) {
  const { icon: Icon, tint } = getNotificationVisual(n);
  const meta = n.meta || {};
  const deepLink = meta.deepLink || meta.deeplink;
  const isRefund = String(n.type || "").startsWith("REFUND");

  const metaKeys = [
    ...META_ORDER.filter((k) => k in meta),
    ...Object.keys(meta).filter((k) => !META_ORDER.includes(k)),
  ].filter((k) => !HIDDEN_META_KEYS.has(k));

  // Deadline still ahead? Highlight it so the vendor knows to act.
  const respondByDate = meta.respondBy ? new Date(meta.respondBy) : null;
  const deadlineOpen = respondByDate && !Number.isNaN(respondByDate.getTime()) && respondByDate > new Date();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft size={14} />
          All notifications
        </button>
      </div>

      <div className="no-scrollbar flex-1 animate-fade-up overflow-y-auto px-5 py-2">
        <span className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
          <Icon size={22} />
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {n.severity && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${SEVERITY_STYLES[n.severity] || DEFAULT_SEVERITY_STYLE}`}>
              {humanize(n.severity)}
            </span>
          )}
          {n.type && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {humanize(n.type)}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-base font-bold text-gray-900 dark:text-gray-100">{n.title}</h3>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">{n.body}</p>

        {deadlineOpen && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            Action needed — respond by {formatDateTime(meta.respondBy)}
          </p>
        )}

        {metaKeys.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Details</p>
            <dl className="rounded-2xl bg-gray-50 px-4 py-1.5 dark:bg-gray-700/40">
              {metaKeys.map((key) => (
                <div key={key} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{META_LABELS[key] || labelFromKey(key)}</dt>
                  <dd
                    className={`text-right text-xs font-semibold text-gray-800 break-all dark:text-gray-100 ${
                      ID_LIKE_KEYS.test(key) ? "font-mono font-normal text-[11px]" : ""
                    }`}
                  >
                    {formatMetaValue(key, meta[key])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Activity</p>
          <dl className="rounded-2xl bg-gray-50 px-4 py-1.5 dark:bg-gray-700/40">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-xs text-gray-500 dark:text-gray-400">Received</dt>
              <dd className="text-xs font-semibold text-gray-800 dark:text-gray-100">{formatDateTime(n.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-xs text-gray-500 dark:text-gray-400">Read</dt>
              <dd className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                {n.readAt ? formatDateTime(n.readAt) : n.isRead ? "Yes" : "Not yet"}
              </dd>
            </div>
            {Array.isArray(n.channels) && n.channels.length > 0 && (
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="text-xs text-gray-500 dark:text-gray-400">Sent via</dt>
                <dd className="text-xs font-semibold text-gray-800 dark:text-gray-100">{n.channels.map(humanize).join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-5 pb-5 pt-3">
        {isRefund && (
          <button
            type="button"
            onClick={() => onNavigate("/refunds")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-600"
          >
            <ReceiptText size={14} />
            View Refund Requests
          </button>
        )}
        {deepLink && (
          <button
            type="button"
            onClick={() => onNavigate(deepLink)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold ${
              isRefund
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            <ExternalLink size={14} />
            Open
          </button>
        )}
        <button
          type="button"
          onClick={() => onClear(n._id)}
          title="Clear notification"
          className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/15"
        >
          <Trash2 size={14} />
          Clear
        </button>
      </div>
    </div>
  );
}
