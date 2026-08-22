// useSubscription.js
// All state + orchestration logic for the Subscription page lives here so
// the page component itself stays purely presentational.
//
// ⚠️ CHANGED: was calling a mock fetchCurrentSubscription() with hardcoded
// data. There's no separate subscription endpoint — the real plan data
// lives under brand.subscribed in the confirmed brands/get response, so
// this now sources the brand via the shared useBrand() hook and maps it
// through subscriptionService.mapBrandToSubscription.

import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrand } from '../../../hooks/useBrand';
import { mapBrandToSubscription } from '../services/subscriptionService';
import { ROUTES } from '../constants/subscription.constants';

export function useSubscription() {
  const navigate = useNavigate();
  const { brand, loading: isLoading, error: brandError, refetch } = useBrand();

  const subscription = useMemo(() => mapBrandToSubscription(brand), [brand]);

  const error =
    brandError ||
    (!isLoading && brand && !subscription ? "This brand doesn't have an active subscription yet." : null);

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
    refetch,
    goToPlans,
  };
}
