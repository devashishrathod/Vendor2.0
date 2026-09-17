import { useState } from "react";
import { Store, X, CheckCircle2 } from "lucide-react";

// Formats an ISO date string like "2026-08-30T08:37:18.147Z" → "30 Aug 2026"
function formatJoinedDate(isoDate) {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const BrandHeader = ({ brandName, merchantId, logo, onChangeLogo, logoUpdating, logoError, isApproved, joinedDate }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const memberSince = formatJoinedDate(joinedDate);

  return (
    <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {logo ? (
          <img src={logo} alt={brandName || "Brand logo"} className="w-full h-full object-cover" />
        ) : (
          <Store size={20} className="text-emerald-500" strokeWidth={1.8} />
        )}
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900 capitalize leading-tight">{brandName}</h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Merchant ID : {merchantId || "—"}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {logo && (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              View
            </button>
          )}
          <button
            type="button"
            onClick={onChangeLogo}
            disabled={logoUpdating}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            {logoUpdating ? "Uploading…" : "Change"}
          </button>
        </div>
        {logoError && <p className="mt-1 text-xs text-red-500">{logoError}</p>}
      </div>

      {previewOpen && logo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="relative max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close"
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={22} />
            </button>
            <img
              src={logo}
              alt="Brand logo"
              className="max-h-[70vh] w-full rounded-2xl bg-white object-contain p-4"
            />
          </div>
        </div>
      )}
    </div>

    {isApproved && (
      <div className="hidden sm:flex flex-col items-start gap-0.5 rounded-md bg-emerald-50 px-4 py-2 flex-shrink-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <CheckCircle2 size={14} />
          Verified
        </span>
        {memberSince && (
          <span className="text-[11px] text-gray-400">Member since {memberSince}</span>
        )}
      </div>
    )}
    </div>
  );
};

export default BrandHeader;
