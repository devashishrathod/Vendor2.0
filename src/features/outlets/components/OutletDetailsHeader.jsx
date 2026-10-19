import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, Share2, MapPin, MoreVertical, Copy, Check, CalendarDays } from "lucide-react";
import { OUTLET_STATUS, OUTLET_TYPES } from "../constants/outletConstants";
import { formatJoinedDate, getAwningVariant, maskStoreId, cx, toTitleCase } from "../utils/outletUtils";
import { OpenSign, StoreAwning, StoreTile } from "./Storefront";

// ⚠️ FIXED: outlet.outletName / outlet.registrationType haven't existed on
// the outlet record since the Add Outlet form dropped them (name & address
// now come from the picked Location, and "registration type" became
// outletType) — this was still reading the old field names and rendering
// blank. Now reads the mapped `outlet` shape useOutlets/useOutletDetails
// both produce, plus `brand` for the outlet's display name.
export default function OutletDetailsHeader({ outlet, brand, onBack }) {
  const displayName = toTitleCase(brand?.brandName || brand?.legalBusinessName) || "Outlet";
  const isVerified = brand?.isApproved;
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const location = outlet?.raw?.location;
  const [lng, lat] = location?.geo?.coordinates || [];
  const hasCoords = typeof lat === "number" && typeof lng === "number";

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleShare = async () => {
    const shareData = {
      title: `${displayName} — ${maskStoreId(outlet.storeId)}`,
      text: `${displayName} outlet details`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleViewOnMap = () => {
    if (!hasCoords) return;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank", "noopener,noreferrer");
  };

  const handleCopyStoreId = async () => {
    await navigator.clipboard.writeText(outlet.storeId);
    setMenuOpen(false);
  };

  const variant = getAwningVariant(outlet);
  const isActive = outlet.status === OUTLET_STATUS.ACTIVE;
  const isFranchise = outlet.outletType === OUTLET_TYPES.FRANCHISE;
  const actionClass =
    "flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-emerald-200 hover:text-emerald-700 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200 dark:hover:text-emerald-400";

  // Storefront hero: the same awning + hanging sign as the outlet cards,
  // scaled up, with the brand name as the shop's signboard.
  return (
    <div className="relative rounded-3xl border border-emerald-100/80 bg-white shadow-[0_10px_30px_rgba(4,120,87,0.08)] dark:border-white/5 dark:bg-gray-800 dark:shadow-none">
      <StoreAwning variant={variant} height="h-16" className="overflow-hidden rounded-t-3xl">
        <button
          onClick={onBack}
          aria-label="Back to outlets"
          className="absolute left-4 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow transition-colors hover:text-emerald-700 dark:bg-gray-900 dark:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span
          className={cx(
            "absolute left-16 top-[18px] rounded-full bg-white px-3.5 py-1 text-xs font-bold shadow dark:bg-gray-900",
            variant === "closed"
              ? "text-gray-600 dark:text-gray-300"
              : isFranchise
                ? "text-amber-700 dark:text-amber-400"
                : "text-emerald-700 dark:text-emerald-400"
          )}
        >
          {isFranchise ? "Franchise Outlet" : "Own Outlet"}
        </span>
      </StoreAwning>

      <OpenSign open={isActive} size="lg" className="absolute right-6 top-[72px] z-10 sm:right-10" />

      <div className="flex flex-col gap-5 px-5 pb-6 pt-5 sm:px-7">
        <div className="flex items-center gap-4 pr-28">
          <StoreTile variant={variant} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{displayName}</p>
              {isVerified && (
                <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Verified brand" />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.12em] text-gray-500 dark:text-gray-400">STORE ID</span>
              <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">{maskStoreId(outlet.storeId)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-[1.5px] border-dashed border-emerald-100 pt-4 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-white/5 dark:text-gray-300">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
              Joined {formatJoinedDate(outlet.joinedDate)}
            </span>
            <span
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              )}
            >
              <span className={cx("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-gray-400")} />
              {isActive ? "Open for business" : "Account inactive"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleShare} className={actionClass}>
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Copied" : "Share"}
            </button>

            {hasCoords && (
              <button onClick={handleViewOnMap} className={actionClass}>
                <MapPin className="h-4 w-4" />
                View on Map
              </button>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="More actions"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:text-emerald-700 dark:border-white/10 dark:bg-gray-800 dark:text-gray-300"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-44 rounded-xl bg-white py-1 shadow-lg dark:bg-gray-800">
                  <button
                    onClick={handleCopyStoreId}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Store Id
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
