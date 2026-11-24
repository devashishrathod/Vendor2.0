import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore';
import { routeForScreen } from '@/features/onboarding-v2/config/routes';
import { useOnboardingStatusStore, selectCurrentScreen } from '@/features/onboarding-v2/store/statusStore';

// Logged in → the page for the server's current screen (StatusGate has
// already loaded the onboarding status).
export default function PublicRoute({ children }) {
  const token         = useAuthStore((s) => s.token);
  const currentScreen = useOnboardingStatusStore(selectCurrentScreen);

  if (!token) return children;
  return <Navigate to={routeForScreen(currentScreen)} replace />;
}
