// src/features/voucher/components/voucher/VoucherBannerModal.jsx
// Opened from VoucherTable's "Voucher Banner" action — lets a vendor
// update or delete an already-created voucher's banner via the dedicated
// POST/DELETE /vouchers/:id/banner endpoints, without touching the rest
// of the voucher.
import { Loader2, Trash2, Upload, X } from "lucide-react";
import useVoucherBanner from "../../hooks/voucher/useVoucherBanner";

const inputBase =
  "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors " +
  "placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function VoucherBannerModal({ voucher, onClose, onSaved }) {
  const {
    bannerType,
    setBannerType,
    bannerImage,
    setBannerImage,
    bannerVideo,
    setBannerVideo,
    bannerGif,
    setBannerGif,
    isSaving,
    isDeleting,
    error,
    save,
    remove,
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

  const handleDelete = async () => {
    try {
      await remove();
      onSaved?.(null);
      onClose();
    } catch {
      // error is already surfaced via the hook's `error` state
    }
  };

  const imagePreviewUrl = bannerImage ? URL.createObjectURL(bannerImage) : voucher.bannerImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-bold text-gray-900">Voucher Banner</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="mb-1.5 block text-xs font-medium text-gray-500">Banner Type</label>
          <select
            value={bannerType}
            onChange={(e) => setBannerType(e.target.value)}
            className={`${inputBase} mb-3`}
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="GIF">GIF</option>
          </select>

          {bannerType === "IMAGE" && (
            <div className="flex items-center gap-3">
              {imagePreviewUrl && (
                <img
                  src={imagePreviewUrl}
                  alt=""
                  className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
                />
              )}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50/40">
                <Upload className="h-4 w-4" />
                <span className="text-[10px]">{imagePreviewUrl ? "Change" : "Add"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setBannerImage(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          )}

          {bannerType === "VIDEO" && (
            <input
              value={bannerVideo}
              onChange={(e) => setBannerVideo(e.target.value)}
              placeholder="Banner video URL"
              className={inputBase}
            />
          )}

          {bannerType === "GIF" && (
            <input
              value={bannerGif}
              onChange={(e) => setBannerGif(e.target.value)}
              placeholder="Banner GIF URL"
              className={inputBase}
            />
          )}

          {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-500 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300"
          >
            {isSaving ? "Updating…" : "Update Banner"}
          </button>
        </div>
      </div>
    </div>
  );
}
