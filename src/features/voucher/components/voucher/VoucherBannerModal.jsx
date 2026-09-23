// src/features/voucher/components/voucher/VoucherBannerModal.jsx
// Opened from VoucherTable's "Voucher Banner" action — submits a new
// banner for an already-created voucher via the dedicated POST
// /vouchers/:id/banner endpoint, without touching the rest of the voucher.
import { Upload, X } from "lucide-react";
import useVoucherBanner from "../../hooks/voucher/useVoucherBanner";

export default function VoucherBannerModal({ voucher, onClose, onSaved }) {
  const {
    bannerMedia,
    setBannerMedia,
    bannerPoster,
    setBannerPoster,
    isVideo,
    isSaving,
    error,
    save,
  } = useVoucherBanner(voucher);

  if (!voucher) return null;

  const handleSave = async () => {
    try {
      const saved = await save();
      onSaved?.(saved);
      onClose();
    } catch {
      // error is already surfaced via the hook's `error` state
    }
  };

  // Confirmed real shape (vendor_panel_api_doc.md #59, V-4):
  // voucher.voucher.banner.{current, pending, status, rejectionReason} —
  // `current` is whatever's actually live/approved right now.
  const existingBanner = voucher.voucher?.banner;
  const currentUrl = existingBanner?.current?.url;
  const currentIsVideo = existingBanner?.current?.kind === "VIDEO";

  const mediaPreviewUrl = bannerMedia ? URL.createObjectURL(bannerMedia) : currentUrl;
  const mediaPreviewIsVideo = bannerMedia ? isVideo : currentIsVideo;
  const canSave = !!bannerMedia && (!isVideo || !!bannerPoster);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Voucher Banner</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="mb-3 text-xs text-gray-400">
            One file — image, GIF or video. Your new banner goes to review; the current one stays live until it's approved.
          </p>

          <div className="flex items-center gap-3">
            {mediaPreviewUrl && (
              mediaPreviewIsVideo ? (
                <video
                  src={mediaPreviewUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <img src={mediaPreviewUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
              )
            )}
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10">
              <Upload className="h-4 w-4" />
              <span className="text-[10px]">{bannerMedia ? "Change" : "Add"}</span>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setBannerMedia(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {isVideo && (
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Poster (required for a video banner)</label>
              <div className="flex items-center gap-3">
                {bannerPoster && (
                  <img
                    src={URL.createObjectURL(bannerPoster)}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                )}
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10">
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px]">{bannerPoster ? "Change" : "Add"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setBannerPoster(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
        </div>

        <div className="flex gap-2 px-6 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !canSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-300"
          >
            {isSaving ? "Submitting…" : "Submit Banner for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
