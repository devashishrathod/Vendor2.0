import { useId } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";

// Coupon-style wavy bottom edge: a row of small semicircles bulging down,
// filled with the card color and outlined with the card's border color so
// it stays visible on a white background (a plain mask/cut-out didn't).
function ScallopEdge() {
  const id = `scallop-${useId().replace(/:/g, "")}`;
  return (
    <svg className="-mt-px block h-2.5 w-full" aria-hidden="true">
      <defs>
        <pattern id={id} width="14" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 0 A7 7 0 0 0 14 0 Z" className="fill-white dark:fill-gray-700" />
          <path d="M0 0 A7 7 0 0 0 14 0" fill="none" strokeWidth="1" className="stroke-violet-200 dark:stroke-violet-500/40" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

const USAGE_TYPE_LABELS = {
  ONCE_PER_USER: "Single use per user",
  MULTIPLE: "Multiple use",
};

const formatRupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const formatDay = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : null;

/**
 * Coupon-style card for one voucher version on the dashboard's Top
 * Performing Voucher row. Everything shown comes from the voucher version
 * and its first offer (title, minBillAmount, discountType/Value,
 * maxDiscountAmount, usageType) plus the real use count — no selling price
 * or refund policy, since the API doesn't have those.
 *
 * @param {{ voucher: object, usage: { count: number, trend: number } | null }} props
 */
export default function VoucherTicketCard({ voucher, usage }) {
  const offer = voucher.offers?.[0] || {};
  const isPercent = offer.discountType === "PERCENTAGE";
  const hasDiscount = offer.discountValue != null && offer.discountValue !== "";
  const saveLabel = hasDiscount ? (isPercent ? `${offer.discountValue}%` : formatRupees(offer.discountValue)) : null;
  const title = offer.title || voucher.name || "Voucher";
  const validTill = formatDay(voucher.endAt);
  const detailId = voucher.voucherId || voucher.voucher?._id;

  return (
    <div className="flex w-80 flex-none snap-start flex-col">
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-t-2xl border border-b-0 border-violet-200 bg-white pb-4 dark:border-violet-500/40 dark:bg-gray-700">
        {saveLabel && (
          <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-br from-violet-500 to-indigo-500 px-3.5 py-1.5 text-center text-white">
            <p className="text-[10px] font-medium leading-none opacity-90">Save</p>
            <p className="text-lg font-extrabold leading-tight">{saveLabel}</p>
          </div>
        )}
  
        <div className="px-4 pt-4">
          <p className={`line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 dark:text-gray-100 ${saveLabel ? "pr-20" : ""}`}>
            {title}
          </p>
          {offer.minBillAmount ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum Purchase: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatRupees(offer.minBillAmount)}</span>
            </p>
          ) : null}
          <p className="mt-0.5 truncate text-[11px] text-gray-400">
            {voucher.name && voucher.name !== title ? `${voucher.name} · ` : ""}
            {voucher.versionCode}
          </p>
        </div>
  
        <div className="mx-4 mt-3 border-t border-dashed border-gray-200 dark:border-gray-600" />
  
        <div className="flex flex-1 items-end justify-between gap-3 px-4 pt-3">
          <div className="min-w-0 text-xs">
            <p className="text-gray-600 dark:text-gray-300">
              {validTill ? `Valid till ${validTill}` : "No expiry"}
              {detailId && (
                <>
                  {" | "}
                  <Link to={`/vouchers/${detailId}`} className="font-semibold text-violet-600 hover:underline dark:text-violet-400">
                    More details
                  </Link>
                </>
              )}
            </p>
            <p className="mt-1 text-gray-400">{USAGE_TYPE_LABELS[offer.usageType] || "—"}</p>
          </div>
  
          <div className="shrink-0 text-right">
            {isPercent && offer.maxDiscountAmount ? (
              <p className="text-[11px] text-gray-400">Up to {formatRupees(offer.maxDiscountAmount)}</p>
            ) : null}
            <p className="flex items-center justify-end gap-1 text-base font-extrabold text-gray-900 dark:text-gray-100">
              {usage ? usage.count.toLocaleString("en-IN") : 0}
              <span className="text-[11px] font-medium text-gray-400">uses</span>
            </p>
            {usage && usage.count >= 2 && (
              <p className={`flex items-center justify-end gap-0.5 text-[11px] font-semibold ${usage.trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {usage.trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(usage.trend).toFixed(0)}%
              </p>
            )}
            {detailId && (
              <Link
                to={`/vouchers/${detailId}`}
                className="mt-1.5 inline-flex items-center gap-0.5 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-300 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/40"
              >
                View <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </div>
      </div>
      <ScallopEdge />
    </div>
  );
}
