import { Navigate, useLocation } from 'react-router-dom';
import { routeForScreen } from '@/features/onboarding-v2/config/routes';
import { useOnboardingStatusStore, selectCurrentScreen } from '@/features/onboarding-v2/store/statusStore';
import { isPathAllowed } from './routeAccess';

/**
 * Wraps the dashboard pages. A vendor still onboarding who opens one by URL
 * (typed, bookmarked, an old link) goes to the screen from
 * GET /brands/onboarding/status (guide §2) — apart from what that screen
 * allows (drafting vouchers under review, the plan pages). DASHBOARD vendors
 * pass straight through. StatusGate has already loaded the status.
 */
export default function DashboardOnlyRoute({ children }) {
  const { pathname } = useLocation();
  const currentScreen = useOnboardingStatusStore(selectCurrentScreen);

  if (!currentScreen || isPathAllowed(currentScreen, pathname)) return children;
  return <Navigate to={routeForScreen(currentScreen)} replace />;
}
