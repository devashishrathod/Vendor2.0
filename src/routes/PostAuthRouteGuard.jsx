import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { routeForScreen } from '@/features/onboarding-v2/config/routes';
import { useOnboardingStatusStore, selectCurrentScreen } from '@/features/onboarding-v2/store/statusStore';
import { isPathAllowed } from './routeAccess';

export default function PostAuthRouteGuard({ children }) {
  const navigate      = useNavigate();
  const location       = useLocation();
  // The server's screen (GET /brands/onboarding/status) — the only routing source.
  const currentScreen  = useOnboardingStatusStore(selectCurrentScreen);
  const screenRef       = useRef(currentScreen);

  // The page the vendor is actually ON right now, kept in a ref (not just
  // read from `location.pathname` inside the handler below) because by the
  // time a popstate handler runs, `window.location`/React Router's own
  // location have usually already moved to wherever the browser genuinely
  // navigated — this ref still holds the page being left, since it only
  // updates via the render effect further down, one commit behind.
  const activePathRef = useRef(location.pathname);

  useEffect(() => { screenRef.current = currentScreen; }, [currentScreen]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // ⚠️ FIXED: the Plan & Billing "Upgrade" side-flow's Checkout step
      // (/subscription/checkout) used to also run its own separate
      // pushState/popstate trap locally (SubscriptionCheckout.jsx) on top
      // of this app-wide one — two independent history-manipulation loops
      // racing on the same browser back press, which is what made it land
      // on stale entries like /brand-outlet instead of reliably going back
      // to the plan picker. Handling it here instead, as the single place
      // that owns popstate, removes that race: back off Checkout always
      // means "return to the plan picker", regardless of currentScreen or
      // whatever this tab's real history stack happens to contain.
      if (activePathRef.current?.startsWith('/subscription/checkout')) {
        navigate('/subscription', { replace: true });
        window.history.pushState(null, '', '/subscription');
        return;
      }

      const screen       = screenRef.current;
      if (!screen) return;
      const correctPath  = routeForScreen(screen);

      if (isPathAllowed(screen, window.location.pathname)) return;

      navigate(correctPath, { replace: true });
      window.history.pushState(null, '', correctPath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    activePathRef.current = location.pathname;
  }, [location.pathname]);

  return children;
}