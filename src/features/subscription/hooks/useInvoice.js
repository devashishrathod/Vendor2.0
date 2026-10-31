import { useCallback, useEffect, useState } from 'react';
import { regenerateSubscriptionInvoice } from '../services/subscriptionService';

/**
 * The subscription's tax invoice: `baseInvoice` (subscription.invoice,
 * built from /subscribeds/get) plus the invoice number + PDF link, which
 * only POST /transactions/invoice/regenerate returns. That call runs once
 * per transaction, when `enabled` (the modal opening) — not on page load.
 * If it fails, the invoice still shows; only the number/PDF are missing.
 */
export function useInvoice(baseInvoice, { enabled = true } = {}) {
  const transactionId = baseInvoice?.transactionId;
  // Keyed by transaction so a different subscription never shows a stale number.
  const [issued, setIssued] = useState({ transactionId: null, data: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!transactionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await regenerateSubscriptionInvoice(transactionId);
      setIssued({ transactionId, data });
    } catch (err) {
      setError(err?.message || 'Could not fetch the invoice number.');
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  const hasIssued = issued.transactionId === transactionId && issued.data;

  useEffect(() => {
    if (enabled && transactionId && !hasIssued) load();
  }, [enabled, transactionId, hasIssued, load]);

  const data = hasIssued ? issued.data : null;
  const invoice = baseInvoice
    ? {
        ...baseInvoice,
        invoiceNumber: data?.invoiceId ?? null,
        invoiceUrl: data?.invoiceUrl ?? null,
        invoiceDate: data?.issuedAt ?? baseInvoice.invoiceDate,
      }
    : null;

  return { invoice, isLoading, error, refetch: load };
}
