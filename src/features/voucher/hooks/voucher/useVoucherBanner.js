// src/features/voucher/hooks/voucher/useVoucherBanner.js
// Drives VoucherBannerModal.jsx — update/delete an EXISTING voucher's
// banner through the dedicated POST/DELETE /vouchers/:id/banner endpoints.
// Kept separate from useVoucherForm.js on purpose: this only ever runs
// against an already-created voucher, from the table, not the add/edit form.
import { useCallback, useState } from "react";
import { updateVoucherBanner, deleteVoucherBanner } from "../../services/voucher/VoucherService";

export default function useVoucherBanner(voucher) {
  // `voucher` here is actually a VERSION object (see VoucherTable.jsx) — the
  // real banner lives nested on its parent voucher, by type: { type,
  // image: { url }, video: { url }, gif: { url } }, not flat
  // bannerType/bannerImage/bannerVideo/bannerGif fields on the version.
  const existingBanner = voucher?.voucher?.banner;
  const [bannerType, setBannerType] = useState(existingBanner?.type || "IMAGE");
  const [bannerImage, setBannerImage] = useState(null); // newly-picked File, pending upload
  const [bannerVideo, setBannerVideo] = useState(
    existingBanner?.type === "VIDEO" ? existingBanner?.video?.url || "" : ""
  );
  const [bannerGif, setBannerGif] = useState(
    existingBanner?.type === "GIF" ? existingBanner?.gif?.url || "" : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await updateVoucherBanner(voucher.voucherId, {
        bannerType,
        bannerImage,
        bannerVideo,
        bannerGif,
      });
      return saved;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [voucher, bannerType, bannerImage, bannerVideo, bannerGif]);

  const remove = useCallback(async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteVoucherBanner(voucher.voucherId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [voucher]);

  return {
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
  };
}
