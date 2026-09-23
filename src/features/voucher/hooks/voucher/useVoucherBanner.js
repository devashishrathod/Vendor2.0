// src/features/voucher/hooks/voucher/useVoucherBanner.js
// Drives VoucherBannerModal.jsx — submit a new banner for review on an
// EXISTING voucher, through the dedicated POST /vouchers/:id/banner
// endpoint. Kept separate from useVoucherForm.js on purpose: this only
// ever runs against an already-created voucher, from the table, not the
// add/edit form.
//
// Confirmed from vendor_panel_api_doc.md #59 (V-4): `bannerType` is gone,
// and so are the three typed file fields — the endpoint now takes a single
// `media` file (image, GIF or video, told apart by its bytes) plus a
// `poster` image that's only required when `media` is a video. There is
// also no DELETE endpoint any more — changing a banner always means
// submitting a new one, which goes to PENDING review; the currently-live
// (`current`) banner keeps showing to customers until that's approved.
import { useCallback, useState } from "react";
import { updateVoucherBanner } from "../../services/voucher/VoucherService";

export default function useVoucherBanner(voucher) {
  const [bannerMedia, setBannerMediaRaw] = useState(null); // newly-picked File
  const [bannerPoster, setBannerPoster] = useState(null); // required only when bannerMedia is a video
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const isVideo = !!bannerMedia?.type?.startsWith("video/");

  // Picking a non-video media clears any poster left over from a previous
  // video pick — it would otherwise be silently sent (and rejected, since
  // a poster on a non-video banner is a 422).
  const setBannerMedia = useCallback((file) => {
    setBannerMediaRaw(file);
    if (!file?.type?.startsWith("video/")) setBannerPoster(null);
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await updateVoucherBanner(voucher.voucherId, {
        media: bannerMedia,
        poster: bannerPoster,
      });
      return saved;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [voucher, bannerMedia, bannerPoster]);

  return {
    bannerMedia,
    setBannerMedia,
    bannerPoster,
    setBannerPoster,
    isVideo,
    isSaving,
    error,
    save,
  };
}
