import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore';
import { ONBOARDING_ROUTES, SCREEN_ROUTES } from '@/features/onboarding-v2/config/routes';

export default function PublicRoute({ children }) {
  const token         = useAuthStore((s) => s.token);
  const currentScreen = useAuthStore((s) => s.currentScreen);

  if (!token) return children;

  // Post-onboarding screen hai → sahi route pe bhejo
  const redirect = SCREEN_ROUTES[currentScreen];
  if (redirect) return <Navigate to={redirect} replace />;

  // Onboarding screen hai → onboarding wizard pe bhejo
  return <Navigate to={ONBOARDING_ROUTES.WIZARD} replace />;
}
