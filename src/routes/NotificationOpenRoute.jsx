import { Navigate, useSearchParams } from 'react-router-dom';
import { routeForScreen } from '@/features/onboarding-v2/config/routes';
import { useOnboardingStatusStore, selectCurrentScreen } from '@/features/onboarding-v2/store/statusStore';
import { notificationTarget } from '@/utils/notificationLinks';
import { isPathAllowed } from './routeAccess';

/**
 * Where an OS notification click lands: `/notifications/open?type=…&link=…`
 * (public/firebase-messaging-sw.js). Goes to the notification's page — the
 * same map the bell uses — or to the vendor's own screen when that page isn't
 * open to them yet. The server's status decides, never the link alone.
 */
export default function NotificationOpenRoute() {
  const [params] = useSearchParams();
  const currentScreen = useOnboardingStatusStore(selectCurrentScreen);

  const target = notificationTarget({ type: params.get('type'), deepLink: params.get('link') })?.to;
  const allowed = target && isPathAllowed(currentScreen, target.split('?')[0]);

  return <Navigate to={allowed ? target : routeForScreen(currentScreen)} replace />;
}
