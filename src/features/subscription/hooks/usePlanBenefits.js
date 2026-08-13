import { useCallback, useEffect, useState } from 'react';
import { fetchPlanBenefits } from '../services/planBenefitsService';

export function usePlanBenefits(planName, { enabled = true } = {}) {
  const [benefits, setBenefits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPlanBenefits(planName);
      setBenefits(data);
    } catch (err) {
      setError(err?.message || 'Failed to load plan benefits.');
    } finally {
      setIsLoading(false);
    }
  }, [planName, enabled]);

  // Only fetches once `enabled` becomes true — e.g. when a modal opens —
  // so we don't fetch benefit details on initial page load.
  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  return { benefits, isLoading, error, refetch: load };
}
