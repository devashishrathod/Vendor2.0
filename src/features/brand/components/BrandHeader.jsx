import { useState } from "react";
import { Store, X, CheckCircle2, ImageIcon } from "lucide-react";

// Formats an ISO date string like "2026-08-30T08:37:18.147Z" → "30 Aug 2026"
function formatJoinedDate(isoDate) {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const linkButton =
  "text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline";

/**
 * Brand header: logo and cover image (view / change), merchant id, and the
 * Verified badge — the admin's own mark (`isVerified`), not approval
 * (guide §11, §14).
 */
const BrandHeader = ({
  brandName,
  merchantId,
  logo,
  coverImage,
  onChangeLogo,
  onChangeCover,
  uploading,
  imageError,
  isVerified,
  joinedDate,
}) => {
  const [preview, setPreview] = useState(null); // image url being previewed
  const memberSince = formatJoinedDate(joinedDate);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {logo ? (
            <img src={logo} alt={brandName || "Brand logo"} className="w-full h-full object-cover" />
          ) : (
            <Store size={20} className="text-emerald-500 dark:text-emerald-400" strokeWidth={1.8} />
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize leading-tight">{brandName}</h1>
          <p className="mt-0.5 text-xs text-gray-400">Merchant ID : {merchantId || "—"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs text-gray-500">Logo:</span>
            {logo && (
              <button type="button" onClick={() => setPreview(logo)} className={linkButton}>
                View
              </button>
            )}
            <button type="button" onClick={onChangeLogo} disabled={Boolean(uploading)} className={linkButton}>
              {uploading === "logo" ? "Uploading…" : "Change"}
            </button>
            <span className="text-xs text-gray-500">Cover:</span>
            {coverImage && (
              <button type="button" onClick={() => setPreview(coverImage)} className={linkButton}>
                View
              </button>
            )}
            <button type="button" onClick={onChangeCover} disabled={Boolean(uploading)} className={linkButton}>
              {uploading === "coverImage" ? "Uploading…" : coverImage ? "Change" : "Add"}
            </button>
          </div>
          {imageError && <p className="mt-1 text-xs text-red-500">{imageError}</p>}
        </div>

        {coverImage && (
          <button
            type="button"
            onClick={() => setPreview(coverImage)}
            className="hidden h-12 w-24 overflow-hidden rounded-lg ring-1 ring-gray-200 sm:block dark:ring-gray-700"
            aria-label="View cover image"
          >
            <img src={coverImage} alt="" className="h-full w-full object-cover" />
          </button>
        )}
        {!coverImage && (
          <span className="hidden h-12 w-24 place-items-center rounded-lg bg-gray-50 text-gray-300 ring-1 ring-dashed ring-gray-200 sm:grid dark:bg-gray-800 dark:ring-gray-700" aria-hidden="true">
            <ImageIcon size={18} />
          </span>
        )}

        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setPreview(null)}>
            <div className="relative max-w-lg" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label="Close"
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <X size={22} />
              </button>
              <img src={preview} alt="Brand image" className="max-h-[70vh] w-full rounded-2xl bg-white object-contain p-4" />
            </div>
          </div>
        )}
      </div>

      {isVerified && (
        <div className="hidden sm:flex flex-col items-start gap-0.5 rounded-md bg-emerald-50 px-4 py-2 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle2 size={14} />
            Verified
          </span>
          {memberSince && <span className="text-[11px] text-gray-400">Member since {memberSince}</span>}
        </div>
      )}
    </div>
  );
};

export default BrandHeader;
