// useSubscription.js
// All state + orchestration logic for the Subscription page lives here so
// the page component itself stays purely presentational.
//
// Fetches the real GET /subscribeds/get?brandId= subscription (via
// subscriptionService.getCurrentSubscription) once useBrand() resolves the
// brand's real _id — useBrand() itself only supplies that id, not the
// subscription data.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBrand } from '../../../hooks/useBrand';
import { getCurrentSubscription, mapSubscriptionResponse } from '../services/subscriptionService';
import { ROUTES } from '../constants/subscription.constants';

export function useSubscription() {
  const navigate = useNavigate();
  const { brand, loading: brandLoading, error: brandError, refetch } = useBrand();

  const [subRes, setSubRes] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState(null);

  useEffect(() => {
    if (!brand?._id) return;
    let cancelled = false;
    getCurrentSubscription(brand._id)
      .then((res) => {
        if (cancelled) return;
        setSubRes(res);
        setSubError(null);
      })
      .catch((err) => {
        if (!cancelled) setSubError(err.message || 'Failed to load subscription.');
      })
      .finally(() => {
        if (!cancelled) setSubLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [brand?._id]);

  const subscription = useMemo(() => mapSubscriptionResponse(subRes, brand), [subRes, brand]);

  const isLoading = brandLoading || subLoading;
  const error =
    brandError ||
    subError ||
    (!isLoading && brand && !subscription ? "This brand doesn't have an active subscription yet." : null);

  // Click handler for the "Upgrade" button — navigates to the plans page.
  // Pass the current plan along in navigation state so the plans page can
  // e.g. highlight the user's current tier or exclude it from choices.
  // `returnTo` rides along through checkout too (SubscriptionPlan ->
  // SubscriptionCheckout -> OrderSummary -> WelcomePage) so that after a
  // successful upgrade the vendor lands back on THIS page instead of the
  // onboarding "Create Your Brand Outlet" step, which only makes sense for
  // a brand-new vendor's very first subscribe.
  const goToPlans = useCallback(() => {
    navigate(ROUTES.PLANS, {
      state: { currentPlan: subscription?.planName, returnTo: '/subscription-plan' },
    });
  }, [navigate, subscription]);

  return {
    subscription,
    isLoading,
    error,
    refetch,
    goToPlans,
  };
}
