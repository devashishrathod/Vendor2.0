import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore';

const SCREEN_ROUTES = {
  SUBSCRIBE_PLAN: "/subscription",
  OUTLET_PAGE:    "/brand-outlet",
  UNDER_REVIEW:   "/under-review",
  DASHBOARD:      "/dashboard",
};

const DASHBOARD_GROUP_PREFIXES = ["/dashboard", "/analysis-report"];

function isPathAllowed(currentScreen, pathname) {
  if (currentScreen === "DASHBOARD") {
    return DASHBOARD_GROUP_PREFIXES.some((p) => pathname.startsWith(p));
  }
  return pathname === SCREEN_ROUTES[currentScreen];
}

export default function PostAuthRouteGuard({ children }) {
  const navigate      = useNavigate();
  const location       = useLocation();
  const currentScreen  = useAuthStore((s) => s.currentScreen);
  const screenRef       = useRef(currentScreen);

  useEffect(() => { screenRef.current = currentScreen; }, [currentScreen]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      const screen       = screenRef.current;
      const correctPath  = SCREEN_ROUTES[screen];
      if (!correctPath) return;

      if (isPathAllowed(screen, window.location.pathname)) return;

      navigate(correctPath, { replace: true });
      window.history.pushState(null, '', correctPath);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
  }, [location.pathname]);

  return children;
}