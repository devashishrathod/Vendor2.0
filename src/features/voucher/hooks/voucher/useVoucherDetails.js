// src/hooks/voucher/useVoucherDetails.js
import { useEffect, useState, useCallback } from "react";
import { getVoucherById } from "../../services/voucher/VoucherService";

export default function useVoucherDetails(voucherId) {
  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!voucherId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getVoucherById(voucherId);
      // Confirmed envelope: { success, message, data: { total, totalPages,
      // page, limit, data: [...] } } — same shape as getVouchers(); the
      // single version we asked for (limit: 1) is data.data.data[0].
      const version = res?.data?.data?.[0] ?? null;
      setVoucher(version);
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