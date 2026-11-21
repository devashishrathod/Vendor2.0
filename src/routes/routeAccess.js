import { routeForScreen } from '@/features/onboarding-v2/config/routes';
import { SCREENS } from '@/features/onboarding-v2/config/screens';

// Pages a DASHBOARD vendor may be on: the whole ProtectedRoute><DashboardLayout>
// block in App.jsx (Transactions, Refunds, Vouchers, Settlements, More, Account
// Information, Outlets, Music, Subscription Page, Settings), plus the Plan &
// Billing "Upgrade" side-flow (/subscription, /subscription/checkout — not
// wrapped in DashboardLayout, but still a legitimate place for a
// DASHBOARD-screen vendor to be). A page missing here is bounced to the
// dashboard (DashboardOnlyRoute) and by a back / forward press
// (PostAuthRouteGuard). `startsWith` means one entry also covers its own
// sub-routes (e.g. "/vouchers" covers "/vouchers/:id/edit").
const DASHBOARD_GROUP_PREFIXES = [
  "/analysis-report",
  "/transactions",
  "/refunds",
  "/vouchers",
  "/settlement", // covers both /settlements (list) and /settlement/:id (detail)
  "/more",
  "/account-information",
  "/outlets",
  "/music",
  "/subscription-plan",
  "/settings",
  "/subscription", // Upgrade flow: /subscription (plan picker) + /subscription/checkout
  "/under-review", // revoked / re-approved vendors stay on DASHBOARD; the page itself sends others back
];

// The Plan & Billing side-flow (/subscription → /subscription/checkout) is
// reachable whatever onboarding screen a vendor is on. Exact path or a
// sub-path only: "/subscription-plan" is a dashboard page.
const isPlanFlow = (pathname) => pathname === "/subscription" || pathname.startsWith("/subscription/");

// Under review a vendor may draft vouchers (guide §7.1, §10): the "Draft your
// first voucher" link opens /vouchers/new, and saving lands on the voucher pages.
const UNDER_REVIEW_PREFIXES = ["/vouchers"];

/**
 * Whether a vendor on `currentScreen` (GET /brands/onboarding/status) may be
 * on `pathname`. The dashboard route guard, the back / forward guard and the
 * notification-click route all ask this.
 * @param {string|null|undefined} currentScreen
 * @param {string} pathname
 * @returns {boolean}
 */
export function isPathAllowed(currentScreen, pathname) {
  if (isPlanFlow(pathname)) return true;
  if (currentScreen === SCREENS.DASHBOARD) {
    return DASHBOARD_GROUP_PREFIXES.some((p) => pathname.startsWith(p));
  }
  if (currentScreen === SCREENS.UNDER_REVIEW && UNDER_REVIEW_PREFIXES.some((p) => pathname.startsWith(p))) {
    return true;
  }
  return pathname === routeForScreen(currentScreen);
}
