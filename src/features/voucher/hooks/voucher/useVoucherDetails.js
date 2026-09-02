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
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [voucherId]);

  useEffect(() => {
    load();
  }, [load]);

  return { voucher, isLoading, error, refresh: load };
}