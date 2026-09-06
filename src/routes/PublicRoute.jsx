import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore';
const SCREEN_ROUTES = {
  SUBSCRIBE_PLAN: "/subscription",
  OUTLET_PAGE:    "/brand-outlet",
  UNDER_REVIEW:   "/under-review",
  // The /dashboard route was removed — DASHBOARD now lands on Analysis
  // Report, the dashboard group's new default page.
  DASHBOARD:      "/analysis-report",
};

export default function PublicRoute({ children }) {
  const token         = useAuthStore((s) => s.token);
  const currentScreen = useAuthStore((s) => s.currentScreen);

  if (!token) return children;

  // Post-onboarding screen hai → sahi route pe bhejo
  const redirect = SCREEN_ROUTES[currentScreen];
  if (redirect) return <Navigate to={redirect} replace />;

  // Onboarding screen hai → /onboarding pe bhejo
  return <Navigate to="/onboarding" replace />;
}