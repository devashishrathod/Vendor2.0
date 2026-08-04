// useSubscription.js
// All state + orchestration logic for the Subscription page lives here so
// the page component itself stays purely presentational.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentSubscription } from '../services/subscriptionService';
import { ROUTES } from '../constants/subscription.constants';

export function useSubscription() {
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCurrentSubscription();
      setSubscription(data);
    } catch (err) {
      setError(err?.message || 'Something went wrong while loading your subscription.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // Click handler for the "Upgrade" button — navigates to the plans page.
  // Pass the current plan along in navigation state so the plans page can
  // e.g. highlight the user's current tier or exclude it from choices.
  const goToPlans = useCallback(() => {
    navigate(ROUTES.PLANS, { state: { currentPlan: subscription?.planName } });
  }, [navigate, subscription]);

  return {
    subscription,
    isLoading,
    error,
    refetch: loadSubscription,
    goToPlans,
  };
}
