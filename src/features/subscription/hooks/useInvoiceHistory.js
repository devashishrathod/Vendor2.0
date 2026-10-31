import { useCallback, useEffect, useState } from 'react';
import { getSubscriptionHistory } from '../services/subscriptionService';

// The API caps `limit` at 100 — one page covers any realistic history.
const HISTORY_LIMIT = 100;

/**
 * Purchase history from GET /subscribeds/history. `enabled` defaults to
 * true (standalone history page); pass `enabled: isOpen` inside a modal so
 * it only fetches once the modal opens.
 */
export function useInvoiceHistory({ enabled = true } = {}) {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSubscriptionHistory({ limit: HISTORY_LIMIT });
      setInvoices(res.data || []);
      setTotal(res.total ?? res.data?.length ?? 0);
    } catch (err) {
      setError(err?.message || 'Failed to load purchase history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { invoices, total, isLoading, error, refetch: load };
}
