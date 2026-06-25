import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore';

const SCREEN_ROUTES = {
  SUBSCRIBE_PLAN: "/subscription",
  UNDER_REVIEW:   "/under-review",
  DASHBOARD:      "/oulet",
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