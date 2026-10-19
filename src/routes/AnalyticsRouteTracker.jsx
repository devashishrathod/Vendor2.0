import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/utils/analytics";

// /onboarding keeps one URL for all its sub-steps, so OnboardingPage sends
// its own per-step virtual page views (/onboarding/<screen>) instead.
const SELF_TRACKED_PATHS = ["/onboarding"];

export default function AnalyticsRouteTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (SELF_TRACKED_PATHS.includes(pathname)) return;
    trackPageView(pathname + search);
  }, [pathname, search]);

  return null;
}
