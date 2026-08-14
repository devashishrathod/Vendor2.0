// src/hooks/voucher/useVoucherDetails.js
import { useEffect, useState, useCallback } from "react";
import { fetchVoucherById } from "../../services/voucher/VoucherService";

export default function useVoucherDetails(voucherId) {
  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!voucherId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchVoucherById(voucherId);
      setVoucher(data);
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