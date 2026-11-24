import { Navigate } from "react-router-dom";
import { LIVE_DASHBOARD_ROUTE } from "@/features/onboarding-v2/config/routes";
import { isOnboardingDone, useOnboardingStatusStore } from "@/features/onboarding-v2/store/statusStore";

// Wraps onboarding-only pages (the /onboarding wizard). Once
// the server says onboarding is complete, any route to them — a stale
// redirect, a refresh, a bookmarked URL — goes to the dashboard instead.
export default function OnboardingOnlyRoute({ children }) {
  const status = useOnboardingStatusStore((s) => s.status);

  if (isOnboardingDone(status)) {
    return <Navigate to={LIVE_DASHBOARD_ROUTE} replace />;
  }
  return children;
}
