import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/onboarding/store/authStore';

const SCREEN_ROUTES = {
  SUBSCRIBE_PLAN: "/subscription",
  OUTLET_PAGE:    "/brand-outlet",
  UNDER_REVIEW:   "/under-review",
  // The /dashboard route was removed — DASHBOARD now lands on Analysis
  // Report, the dashboard group's new default page.
  DASHBOARD:      "/analysis-report",
};

// ⚠️ FIXED: this only ever listed "/analysis-report" — but App.jsx's
// DASHBOARD_GROUP_PREFIXES (this whole ProtectedRoute><DashboardLayout>
// block) also covers Transactions, Vouchers, Settlements, More, Account
// Information, Outlets, Music, Subscription Page, and Settings, PLUS the
// Plan & Billing "Upgrade" side-flow (/subscription, /subscription/
// checkout — not wrapped in DashboardLayout, but still a legitimate place
// for a DASHBOARD-screen vendor to be). Any of those NOT listed here meant
// a single browser back/forward press while on that page force-redirected
// straight to /analysis-report (or, for a vendor whose currentScreen
// hadn't advanced to DASHBOARD yet, to that screen's own route instead —
// e.g. /brand-outlet for OUTLET_PAGE) instead of just moving through that
// page's own history. `startsWith` means one entry also covers its own
// sub-routes (e.g. "/vouchers" covers "/vouchers/:id/edit").
const DASHBOARD_GROUP_PREFIXES = [
  "/analysis-report",
  "/transactions",
  "/vouchers",
  "/settlement", // covers both /settlements (list) and /settlement/:id (detail)
  "/more",
  "/account-information",
  "/outlets",
  "/music",
  "/subscription-plan",
  "/settings",
  "/subscription", // Upgrade flow: /subscription (plan picker) + /subscription/checkout
];

// ⚠️ FIXED: the Plan & Billing "Upgrade" side-flow (/subscription →
// /subscription/checkout) is reachable regardless of what onboarding
// screen a vendor is currently on (confirmed: a vendor whose currentScreen
// was still OUTLET_PAGE could reach Checkout) — it isn't tied to any one
// SCREEN_ROUTES entry, so it needs to be allowed independent of
// currentScreen, not just inside the DASHBOARD branch above.
const ALWAYS_ALLOWED_PREFIXES = ["/subscription"];

function isPathAllowed(currentScreen, pathname) {
  if (ALWAYS_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return true;
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
    activePathRef.current = location.pathname;
  }, [location.pathname]);

  return children;
}