import { useCallback, useEffect, useState } from 'react';
import { fetchInvoiceByOrderId } from '../services/invoiceService';

/**
 * `enabled` defaults to true (used by the standalone /invoices/:orderId
 * page, which should fetch as soon as it mounts). Pass `enabled: isOpen`
 * when using this inside a modal so it only fetches once the modal opens.
 */
export function useInvoice(orderId, { enabled = true } = {}) {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!orderId || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInvoiceByOrderId(orderId);
      setInvoice(data);
    } catch (err) {
      setError(err?.message || 'Failed to load invoice.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, enabled]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { invoice, isLoading, error, refetch: load };
}
