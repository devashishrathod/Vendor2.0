import { useEffect, useRef, useState } from "react";
import { Store, Share2, MapPin, MoreVertical, Copy, Crown, ChevronRight, Check } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { OUTLET_TYPE_LABELS, OUTLET_TYPES } from "../constants/outletConstants";
import { formatJoinedDate, maskStoreId, cx } from "../utils/outletUtils";

// ⚠️ FIXED: outlet.outletName / outlet.registrationType haven't existed on
// the outlet record since the Add Outlet form dropped them (name & address
// now come from the picked Location, and "registration type" became
// outletType) — this was still reading the old field names and rendering
// blank. Now reads the mapped `outlet` shape useOutlets/useOutletDetails
// both produce, plus `brand` for the outlet's display name.
export default function OutletDetailsHeader({ outlet, brand, onBack }) {
  const displayName = brand?.brandName || brand?.legalBusinessName || "Outlet";
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

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Store className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-bold text-gray-900 lowercase">{displayName}</p>
              {isVerified && (
                <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.3l2.2 1.1 2.4-.5 1.3 2.1 2.1 1.3-.5 2.4L20.7 11l-1.2 2.3.5 2.4-2.1 1.3-1.3 2.1-2.4-.5L12 19.9l-2.2-1.1-2.4.5-1.3-2.1-2.1-1.3.5-2.4L3.3 11l1.2-2.3-.5-2.4 2.1-1.3L7.4 2.9l2.4.5L12 2.3z" />
                  <path d="M9.5 12.1l1.8 1.8 3.3-3.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Store Id: {maskStoreId(outlet.storeId)}</p>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span
                className={cx(
                  "text-xs font-semibold px-3 py-1 rounded-full",
                  outlet.outletType === OUTLET_TYPES.FRANCHISE
                    ? "bg-sky-50 text-sky-600"
                    : "bg-violet-50 text-violet-600"
                )}
              >
                {OUTLET_TYPE_LABELS[outlet.outletType] || "—"}
              </span>
              <span className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                Joined {formatJoinedDate(outlet.joinedDate)}
              </span>
              <StatusBadge status={outlet.status} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl px-3.5 py-2 hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied" : "Share"}
          </button>

          {hasCoords && (
            <button
              onClick={handleViewOnMap}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl px-3.5 py-2 hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              View on Map
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-10">
                <button
                  onClick={handleCopyStoreId}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Store Id
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5 bg-gradient-to-r from-emerald-50 to-emerald-50/40 border border-emerald-100 rounded-xl px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-800">Great Performance!</p>
          <p className="text-xs text-emerald-600">Keep growing with Trydood.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0" />
      </div>
    </div>
  );
}
