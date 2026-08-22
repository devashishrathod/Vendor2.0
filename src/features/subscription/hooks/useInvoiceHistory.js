import { useCallback, useEffect, useState } from 'react';
import { fetchInvoiceHistory } from '../services/invoiceService';

/**
 * `enabled` defaults to true (used by the standalone history page).
 * Pass `enabled: isOpen` when using this inside a modal.
 */
export function useInvoiceHistory({ enabled = true } = {}) {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInvoiceHistory();
      setInvoices(data);
    } catch (err) {
      setError(err?.message || 'Failed to load invoice history.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { invoices, isLoading, error, refetch: load };
}
