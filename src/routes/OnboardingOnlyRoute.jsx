import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/features/onboarding/store/authStore";
import { isOnboardingComplete } from "@/features/onboarding/utils/onboardingStatus";

// Wraps onboarding-only pages (e.g. Create Outlet at /brand-outlet). Once
// onboarding is complete (isOnBoardingCompleted / DASHBOARD), any route to
// them — a stale redirect, a refresh, a bookmarked URL — goes to the
// dashboard instead of leaving an approved brand stuck on an onboarding page.
export default function OnboardingOnlyRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const currentScreen = useAuthStore((s) => s.currentScreen);

  if (isOnboardingComplete({ user, currentScreen })) {
    return <Navigate to="/analysis-report" replace />;
  }
  return children;
}
