import { useCallback, useState } from 'react';
import { submitQuery } from '../services/queryService';

export function useRaiseQuery() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);

  const submit = useCallback(async (payload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitQuery(payload);
      setTicket(result);
      return result;
    } catch (err) {
      setError(err?.message || 'Failed to submit your query.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTicket(null);
    setError(null);
  }, []);

  return { submit, reset, isSubmitting, error, ticket };
}
