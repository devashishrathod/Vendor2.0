// src/hooks/voucher/useVoucherDetails.js
import { useEffect, useState, useCallback } from "react";
import { getVoucherDetails } from "../../services/voucher/VoucherService";

export default function useVoucherDetails(voucherId) {
  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!voucherId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getVoucherDetails(voucherId);
      // CONFIRMED real shape: res.data is
      // { voucher, brand, currentVersion, publishedVersion, versions,
      //   versionCount, stats } — NOT the flat "version" object the old
      // versions/get-all-based getVoucherById returned. Kept as one object
      // (not flattened) so every field stays traceable to where it really
      // lives — see VoucherDetails.jsx / VoucherDetailsInfo.jsx for how
      // each piece is read (voucher.voucher.*, voucher.currentVersion.*,
      // voucher.brand.*, voucher.stats.*).
      const details = res?.data ?? null;
      setVoucher(details);
    } catch (err) {
      // Confirmed backend quirk (same as AnalysisReport.jsx's voucher
      // list fetch): a version that doesn't exist gets an error-shaped
      // response ("No any voucherversion found") instead of an empty
      // result — that's not a real failure, so it falls through to the
      // page's existing "Voucher not found." message instead of showing
      // the raw backend string.
      if (/no.*voucher.*found/i.test(err.message || "")) {
        setVoucher(null);
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [voucherId]);

  useEffect(() => {
    load();
  }, [load]);

  return { voucher, isLoading, error, refresh: load };
}