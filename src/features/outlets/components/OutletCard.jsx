import { useState } from "react";
import { ArrowRight, CalendarDays, Check, Copy, MapPin, MessageCircle, Pencil } from "lucide-react";
import { OUTLET_STATUS, OUTLET_TYPES } from "../constants/outletConstants";
import { cx, formatShortDate, getAwningVariant, maskStoreId } from "../utils/outletUtils";
import { OpenSign, StoreAwning, StoreTile } from "./Storefront";

// Small WhatsApp-verification mark next to the number (useOutlets reads the
// confirmed user.isWhatsappVerified). `null` = the API didn't say.
function VerifiedMark({ verified }) {
  if (verified === null || verified === undefined) return null;
  return verified ? (
    <span title="WhatsApp number verified" className="text-emerald-600 dark:text-emerald-400">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span title="WhatsApp number not verified yet" className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
      Unverified
    </span>
  );
}

/**
 * Storefront-style outlet card: striped awning colored by outlet type, a
 * hanging OPEN/CLOSED sign, store-id signboard, contact tiles, a map-like
 * address tile and a "counter" footer with the active switch + actions.
 */
export default function OutletCard({ outlet, selected, onSelect, onToggleStatus, onExploreDetails, onEdit }) {
  const [copied, setCopied] = useState(false);
  const whatsapp = outlet.whatsapp || {};
  const isActive = outlet.status === OUTLET_STATUS.ACTIVE;
  const isFranchise = outlet.outletType === OUTLET_TYPES.FRANCHISE;
  const variant = getAwningVariant(outlet);

  const copyStoreId = async () => {
    try {
      await navigator.clipboard.writeText(outlet.storeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Copy store id failed:", error);
    }
  };

  return (
    <article className="relative flex flex-col overflow-hidden rounded-3xl border border-emerald-100/80 bg-white shadow-[0_10px_30px_rgba(4,120,87,0.08)] transition-transform duration-200 hover:-translate-y-0.5 dark:border-white/5 dark:bg-gray-800 dark:shadow-none">
      <StoreAwning variant={variant}>
        <label className="absolute left-3.5 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-[9px] bg-white shadow dark:bg-gray-900">
          <span className="sr-only">Select outlet {maskStoreId(outlet.storeId)}</span>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(outlet.id)}
            className="h-[15px] w-[15px] cursor-pointer accent-emerald-700"
          />
        </label>
        <span
          className={cx(
            "absolute left-[52px] top-[13px] rounded-full bg-white px-3 py-1 text-[11px] font-bold shadow dark:bg-gray-900",
            variant === "closed"
              ? "text-gray-600 dark:text-gray-300"
              : isFranchise
                ? "text-amber-700 dark:text-amber-400"
                : "text-emerald-700 dark:text-emerald-400"
          )}
        >
          {isFranchise ? "Franchise" : "Own Outlet"}
        </span>
      </StoreAwning>

      <OpenSign open={isActive} className="absolute right-[22px] top-[58px] z-10" />

      <div className="flex flex-1 flex-col gap-3.5 px-5 pb-[18px] pt-4">
        {/* Signboard: store icon + store id */}
        <div className="flex items-center gap-3 pr-[88px]">
          <StoreTile variant={variant} />
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.12em] text-gray-500 dark:text-gray-400">STORE ID</p>
            <div className="flex items-center gap-1.5">
              <span className="truncate font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                {maskStoreId(outlet.storeId)}
              </span>
              <button
                type="button"
                onClick={copyStoreId}
                aria-label="Copy store ID"
                className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-emerald-50/70 text-gray-600 transition-colors hover:text-emerald-700 dark:bg-white/5 dark:text-gray-300 dark:hover:text-emerald-400"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-[13px] w-[13px]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Contact tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1 rounded-[14px] bg-emerald-50/60 px-3 py-2.5 dark:bg-white/5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              <MessageCircle className="h-[13px] w-[13px] text-emerald-700 dark:text-emerald-400" />
              WhatsApp
            </span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-gray-100">
              {whatsapp.number || "—"}
              <VerifiedMark verified={whatsapp.verified} />
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-[14px] bg-emerald-50/60 px-3 py-2.5 dark:bg-white/5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              <CalendarDays className="h-[13px] w-[13px] text-emerald-700 dark:text-emerald-400" />
              Joined
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatShortDate(outlet.joinedDate)}</span>
          </div>
        </div>

        {/* Address — a little street-map tile */}
        <div className="map-grid-bg flex min-h-[84px] items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 px-3.5 py-3 dark:border-white/10 dark:bg-gray-900/40">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white shadow-[0_0_0_6px_rgba(4,120,87,0.12)] dark:bg-emerald-600">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold tracking-[0.12em] text-gray-500 dark:text-gray-400">ADDRESS</p>
            <p className="line-clamp-3 text-[13px] font-medium capitalize leading-snug text-gray-800 dark:text-gray-200">
              {outlet.address || "No location saved yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Counter: active switch + actions */}
      <div className="mt-auto flex items-center gap-2.5 border-t-[1.5px] border-dashed border-emerald-100 bg-emerald-50/20 px-5 py-3.5 dark:border-white/10 dark:bg-gray-900/30">
        <button
          type="button"
          onClick={() => onToggleStatus(outlet.id)}
          aria-pressed={isActive}
          className="flex items-center gap-2"
        >
          <span
            className={cx(
              "relative block h-6 w-[42px] rounded-full transition-colors duration-200",
              isActive ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-600"
            )}
          >
            <span
              className={cx(
                "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-[left] duration-200",
                isActive ? "left-[21px]" : "left-[3px]"
              )}
            />
          </span>
          <span className={cx("text-[13px] font-semibold", isActive ? "text-emerald-700 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400")}>
            {isActive ? "Open for business" : "Account inactive"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onEdit(outlet)}
          aria-label="Edit outlet"
          title="Edit outlet"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors hover:text-emerald-700 dark:border-white/10 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-emerald-400"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onExploreDetails(outlet)}
          className="group flex h-10 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-[13px] font-bold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Explore Details
          <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
}
